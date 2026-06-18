# Tüm tsb_enrich kayıtlarını Gemini ile zenginleştir, arac_ozellikleri tablosuna yaz
# Resumable: zaten işlenmiş kayıtları atlar
# Kullanım: powershell -ExecutionPolicy Bypass -File etl\enrich-gemini.ps1

$BATCH_SIZE   = 50
$RETRY_MAX    = 3
$RETRY_DELAY  = 10  # saniye

# .env.local oku
$envPath = Join-Path $PSScriptRoot "../.env.local"
$env = @{}
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.+)$') { $env[$matches[1].Trim()] = $matches[2].Trim() }
}
$SUPABASE_URL = $env["NEXT_PUBLIC_SUPABASE_URL"]
$SUPABASE_KEY = $env["SUPABASE_SERVICE_ROLE_KEY"]
$GEMINI_KEY   = $env["GEMINI_API_KEY"]

$sbHeaders = @{
    "apikey"        = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Accept"        = "application/json"
    "Content-Type"  = "application/json"
}

# Performans sayaçları
$startTime       = Get-Date
$totalInputTokens  = 0
$totalOutputTokens = 0
$totalInserted   = 0
$totalSkipped    = 0
$totalErrors     = 0

# --- Mevcut kayıtları çek (resume için) ---
Write-Host "Mevcut arac_ozellikleri kayıtları kontrol ediliyor..."
$mevcutlar = @{}
$offset = 0
do {
    $batch = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/rest/v1/arac_ozellikleri?select=marka_kodu,tip_kodu&limit=1000&offset=$offset" `
        -Headers $sbHeaders -Method GET
    foreach ($r in $batch) { $mevcutlar["$($r.marka_kodu)|$($r.tip_kodu)"] = $true }
    $offset += $batch.Count
} while ($batch.Count -eq 1000)
Write-Host "Zaten işlenmiş: $($mevcutlar.Count) kayıt"

# --- Tüm tsb_enrich kayıtlarını çek ---
Write-Host "tsb_enrich okunuyor..."
$tumKayitlar = @()
$offset = 0
do {
    $batch = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/rest/v1/tsb_enrich?select=marka_kodu,tip_kodu,marka_adi,tip_adi&limit=1000&offset=$offset&order=marka_kodu.asc,tip_kodu.asc" `
        -Headers $sbHeaders -Method GET
    $tumKayitlar += $batch
    $offset += $batch.Count
} while ($batch.Count -eq 1000)
Write-Host "Toplam tsb_enrich: $($tumKayitlar.Count) kayıt"

# İşlenmemiş kayıtları filtrele
$islenecek = $tumKayitlar | Where-Object { -not $mevcutlar["$($_.marka_kodu)|$($_.tip_kodu)"] }
Write-Host "İşlenecek: $($islenecek.Count) kayıt"
Write-Host ""

# --- Batch işleme ---
$batches = [System.Collections.Generic.List[object[]]]::new()
for ($i = 0; $i -lt $islenecek.Count; $i += $BATCH_SIZE) {
    $batches.Add($islenecek[$i..[Math]::Min($i + $BATCH_SIZE - 1, $islenecek.Count - 1)])
}

$batchNo = 0
foreach ($batch in $batches) {
    $batchNo++
    $pct = [Math]::Round($batchNo / $batches.Count * 100)
    Write-Host "[$batchNo/$($batches.Count)] ($pct%) marka_kodu=$($batch[0].marka_kodu) tip=$($batch[0].tip_kodu)..." -NoNewline

    # Prompt
    $araçlarJson = ($batch | ForEach-Object {
        [PSCustomObject]@{
            marka_kodu = $_.marka_kodu
            tip_kodu   = $_.tip_kodu
            marka_adi  = $_.marka_adi
            tip_adi    = $_.tip_adi
        }
    }) | ConvertTo-Json -Compress

    $prompt = @"
Türkiye pazarında 2026 model yılında satılan araçların TSB (Türkiye Sigorta Birliği) kayıtlarındaki tip isimlerini sınıflandır.
Tüm araçlar Türkiye'de resmi olarak satılan 2026 model yılı araçlardır.
Aşağıdaki JSON dizisindeki her kayıt için aynı sırayla bir çıktı üret.

Giriş:
$araçlarJson

Her kayıt için şu alanları çıkar:
- marka_kodu: (girişten kopyala, integer)
- tip_kodu: (girişten kopyala, integer)
- model_adi: marka adı çıkarıldıktan sonra motor/versiyon bilgisinden önceki model adı. Örnekler: "VOLKSWAGEN TIGUAN 2.0 TDI" → "Tiguan", "FORD TRANSIT CUSTOM 130HP" → "Transit Custom", "BMW 3 SERISI 320I" → "3 Serisi"
- arac_tipi: "binek" veya "ticari" veya "özel" (özel = otobüs, çekici, traktör, ambulans vb.)
- kasa: "sedan" | "hatchback" | "suv" | "crossover" | "station wagon" | "coupe" | "cabrio" | "van" | "pickup" | "minibüs" | "kamyonet" | "kamyon" | null
- yakit: "benzin" | "dizel" | "elektrik" | "hibrit" | "mild hibrit" | "lpg" | null
- vites: "manuel" | "otomatik" | null
- motor_guc_hp: integer veya null
- motor_hacmi: "1.5" gibi string veya null
- cekis: "2wd" | "4wd" | "awd" | null
- koltuk_sayisi: integer veya null (yalnızca minibüs/otobüs için)

Sadece geçerli JSON dizisi döndür, başka hiçbir şey yazma.
"@

    $body = @{
        contents = @(@{ parts = @(@{ text = $prompt }) })
        generationConfig = @{
            responseMimeType = "application/json"
            temperature      = 0
            thinkingConfig   = @{ thinkingBudget = 0 }
        }
    } | ConvertTo-Json -Depth 10 -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

    # Retry loop
    $sonuc = $null
    for ($attempt = 1; $attempt -le $RETRY_MAX; $attempt++) {
        try {
            $resp = Invoke-RestMethod `
                -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_KEY" `
                -Method POST -ContentType "application/json; charset=utf-8" -Body $bodyBytes
            $sonuc = $resp.candidates[0].content.parts[0].text | ConvertFrom-Json
            # Token sayaçları
            if ($resp.usageMetadata) {
                $totalInputTokens  += $resp.usageMetadata.promptTokenCount
                $totalOutputTokens += $resp.usageMetadata.candidatesTokenCount
            }
            break
        } catch {
            $errMsg = $_.ToString()
            if ($attempt -lt $RETRY_MAX) {
                Write-Host " [retry $attempt, bekleniyor ${RETRY_DELAY}s]" -NoNewline
                Start-Sleep -Seconds $RETRY_DELAY
            } else {
                Write-Host " HATA: $errMsg"
                $totalErrors += $batch.Count
            }
        }
    }

    if ($null -eq $sonuc) { continue }

    # tip_adi ve marka_adi ekle (Gemini yanıtında yok)
    $tipMap = @{}
    foreach ($r in $batch) { $tipMap["$($r.marka_kodu)|$($r.tip_kodu)"] = $r }

    $insertRows = $sonuc | ForEach-Object {
        $orig = $tipMap["$($_.marka_kodu)|$($_.tip_kodu)"]
        [PSCustomObject]@{
            marka_kodu   = $_.marka_kodu
            tip_kodu     = $_.tip_kodu
            tip_adi      = $orig.tip_adi
            marka_adi    = $orig.marka_adi
            model_adi    = $_.model_adi
            arac_tipi    = $_.arac_tipi
            kasa         = $_.kasa
            yakit        = $_.yakit
            vites        = $_.vites
            motor_guc_hp = $_.motor_guc_hp
            motor_hacmi  = $_.motor_hacmi
            cekis        = $_.cekis
            koltuk_sayisi = $_.koltuk_sayisi
            kaynak       = "gemini-2.5-flash"
        }
    }

    # Supabase'e upsert
    $insertBody = $insertRows | ConvertTo-Json -Depth 5 -Compress
    $insertBytes = [System.Text.Encoding]::UTF8.GetBytes($insertBody)
    try {
        $upsertHeaders = $sbHeaders.Clone()
        $upsertHeaders["Prefer"] = "resolution=merge-duplicates,return=minimal"
        Invoke-RestMethod `
            -Uri "$SUPABASE_URL/rest/v1/arac_ozellikleri" `
            -Headers $upsertHeaders -Method POST -Body $insertBytes | Out-Null
        $totalInserted += $insertRows.Count
        Write-Host " ok ($($insertRows.Count) kayıt)"
    } catch {
        Write-Host " INSERT HATA: $_"
        $totalErrors += $insertRows.Count
    }

    # Rate limit önlemi: her 10 batch'te 1 saniye bekle
    if ($batchNo % 10 -eq 0) { Start-Sleep -Milliseconds 500 }
}

# --- Özet ---
$elapsed = (Get-Date) - $startTime
$inputCost  = $totalInputTokens  / 1000000 * 0.15
$outputCost = $totalOutputTokens / 1000000 * 0.60
$totalCost  = $inputCost + $outputCost

Write-Host ""
Write-Host "===== ÖZET ====="
Write-Host "Süre         : $([Math]::Round($elapsed.TotalMinutes, 1)) dakika"
Write-Host "Eklenen      : $totalInserted kayıt"
Write-Host "Hata         : $totalErrors kayıt"
Write-Host "Input token  : $totalInputTokens"
Write-Host "Output token : $totalOutputTokens"
Write-Host "Maliyet      : `$$([Math]::Round($totalCost, 4))"
