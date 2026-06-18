# Binek araçlarda kasa/vites/yakit null olanları thinking açık yeniden çek

$BATCH_SIZE = 30  # thinking daha yavaş, küçük batch

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

$startTime = Get-Date
$totalInputTokens = 0; $totalOutputTokens = 0
$totalInserted = 0; $totalErrors = 0

# Binek + en az 1 null olan kayıtları çek
Write-Host "Eksik binek kayıtları çekiliyor..."
$eksik = @(); $offset = 0
do {
    $batch = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/rest/v1/arac_ozellikleri?select=marka_kodu,tip_kodu,tip_adi,marka_adi,arac_tipi,kasa,vites,yakit&arac_tipi=eq.binek&or=(kasa.is.null,vites.is.null,yakit.is.null)&limit=1000&offset=$offset" `
        -Headers $sbHeaders -Method GET
    $eksik += $batch; $offset += $batch.Count
} while ($batch.Count -eq 1000)
Write-Host "Yeniden işlenecek: $($eksik.Count) kayıt"

# Batch'lere böl
$batches = [System.Collections.Generic.List[object[]]]::new()
for ($i = 0; $i -lt $eksik.Count; $i += $BATCH_SIZE) {
    $batches.Add($eksik[$i..[Math]::Min($i + $BATCH_SIZE - 1, $eksik.Count - 1)])
}

$batchNo = 0
foreach ($batch in $batches) {
    $batchNo++
    $pct = [Math]::Round($batchNo / $batches.Count * 100)
    Write-Host "[$batchNo/$($batches.Count)] ($pct%) ..." -NoNewline

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
Tüm araçlar binek araçtır.
Aşağıdaki JSON dizisindeki her kayıt için aynı sırayla bir çıktı üret.

Giriş:
$araçlarJson

Her kayıt için şu alanları çıkar:
- marka_kodu: (girişten kopyala, integer)
- tip_kodu: (girişten kopyala, integer)
- model_adi: marka adı çıkarıldıktan sonra motor/versiyon bilgisinden önceki model adı
- arac_tipi: "binek" veya "ticari" veya "özel"
- kasa: "sedan" | "hatchback" | "suv" | "crossover" | "station wagon" | "coupe" | "cabrio" | "van" | "pickup" | "minibüs" | "kamyonet" | "kamyon" | null
- yakit: "benzin" | "dizel" | "elektrik" | "hibrit" | "mild hibrit" | "lpg" | null
- vites: "manuel" | "otomatik" | null
- motor_guc_hp: integer veya null
- motor_hacmi: "1.5" gibi string veya null
- cekis: "2wd" | "4wd" | "awd" | null
- koltuk_sayisi: integer veya null

Sadece geçerli JSON dizisi döndür, başka hiçbir şey yazma.
"@

    $body = @{
        contents = @(@{ parts = @(@{ text = $prompt }) })
        generationConfig = @{ responseMimeType = "application/json"; temperature = 0 }
    } | ConvertTo-Json -Depth 10 -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

    $sonuc = $null
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            $resp = Invoke-RestMethod `
                -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_KEY" `
                -Method POST -ContentType "application/json; charset=utf-8" -Body $bodyBytes
            $sonuc = $resp.candidates[0].content.parts[0].text | ConvertFrom-Json
            if ($resp.usageMetadata) {
                $totalInputTokens  += $resp.usageMetadata.promptTokenCount
                $totalOutputTokens += $resp.usageMetadata.candidatesTokenCount
            }
            break
        } catch {
            if ($attempt -lt 3) { Write-Host " [retry $attempt]" -NoNewline; Start-Sleep -Seconds 15 }
            else { Write-Host " HATA: $_"; $totalErrors += $batch.Count }
        }
    }
    if ($null -eq $sonuc) { continue }

    $tipMap = @{}
    foreach ($r in $batch) { $tipMap["$($r.marka_kodu)|$($r.tip_kodu)"] = $r }

    $insertRows = $sonuc | ForEach-Object {
        $orig = $tipMap["$($_.marka_kodu)|$($_.tip_kodu)"]
        [PSCustomObject]@{
            marka_kodu    = $_.marka_kodu
            tip_kodu      = $_.tip_kodu
            tip_adi       = $orig.tip_adi
            marka_adi     = $orig.marka_adi
            model_adi     = $_.model_adi
            arac_tipi     = $_.arac_tipi
            kasa          = $_.kasa
            yakit         = $_.yakit
            vites         = $_.vites
            motor_guc_hp  = $_.motor_guc_hp
            motor_hacmi   = $_.motor_hacmi
            cekis         = $_.cekis
            koltuk_sayisi = $_.koltuk_sayisi
            kaynak        = "gemini-2.5-flash-thinking"
        }
    }

    $insertBody  = $insertRows | ConvertTo-Json -Depth 5 -Compress
    $insertBytes = [System.Text.Encoding]::UTF8.GetBytes($insertBody)
    try {
        $upsertHeaders = $sbHeaders.Clone()
        $upsertHeaders["Prefer"] = "resolution=merge-duplicates,return=minimal"
        Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/arac_ozellikleri" `
            -Headers $upsertHeaders -Method POST -Body $insertBytes | Out-Null
        $totalInserted += $insertRows.Count
        Write-Host " ok ($($insertRows.Count))"
    } catch {
        Write-Host " INSERT HATA: $_"; $totalErrors += $insertRows.Count
    }
}

$elapsed = (Get-Date) - $startTime
$cost = ($totalInputTokens / 1000000 * 0.15) + ($totalOutputTokens / 1000000 * 0.60)

Write-Host ""
Write-Host "===== ÖZET ====="
Write-Host "Süre         : $([Math]::Round($elapsed.TotalMinutes, 1)) dakika"
Write-Host "Güncellenen  : $totalInserted kayıt"
Write-Host "Hata         : $totalErrors kayıt"
Write-Host "Input token  : $totalInputTokens"
Write-Host "Output token : $totalOutputTokens"
Write-Host "Maliyet      : `$$([Math]::Round($cost, 4))"
