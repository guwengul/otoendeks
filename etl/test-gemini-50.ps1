# Test: ilk 50 TSB kaydını Gemini'ye gönder, DB'ye yazma

# .env.local oku
$envPath = Join-Path $PSScriptRoot "../.env.local"
$env = @{}
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.+)$') { $env[$matches[1].Trim()] = $matches[2].Trim() }
}
$SUPABASE_URL   = $env["NEXT_PUBLIC_SUPABASE_URL"]
$SUPABASE_KEY   = $env["SUPABASE_SERVICE_ROLE_KEY"]
$GEMINI_KEY     = $env["GEMINI_API_KEY"]

# Supabase'den ilk 50 kayıt çek
$headers = @{
    "apikey"        = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Accept"        = "application/json"
}
$rows = Invoke-RestMethod `
    -Uri "$SUPABASE_URL/rest/v1/tsb_enrich?select=marka_kodu,tip_kodu,marka_adi,tip_adi&limit=50&order=marka_kodu.asc,tip_kodu.asc" `
    -Headers $headers `
    -Method GET

Write-Host "Çekilen kayıt: $($rows.Count)"

# Gemini prompt için giriş listesi
$araçlar = $rows | ForEach-Object {
    [PSCustomObject]@{
        marka_kodu = $_.marka_kodu
        tip_kodu   = $_.tip_kodu
        marka_adi  = $_.marka_adi
        tip_adi    = $_.tip_adi
    }
}
$araçlarJson = $araçlar | ConvertTo-Json -Compress

$prompt = @"
Türk sigorta sektöründe kullanılan araç tip isimlerini sınıflandır.
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
    contents = @(
        @{
            parts = @(
                @{ text = $prompt }
            )
        }
    )
    generationConfig = @{
        responseMimeType = "application/json"
        temperature      = 0
        thinkingConfig   = @{ thinkingBudget = 0 }
    }
} | ConvertTo-Json -Depth 10 -Compress

$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

Write-Host "Gemini'ye gönderiliyor..."
try {
    $response = Invoke-RestMethod `
        -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_KEY" `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Body $bodyBytes

    $rawText = $response.candidates[0].content.parts[0].text
    Write-Host "Ham yanıt (ilk 500 karakter):"
    Write-Host $rawText.Substring(0, [Math]::Min(500, $rawText.Length))

    $sonuclar = $rawText | ConvertFrom-Json
    Write-Host "`nToplam sonuç: $($sonuclar.Count)"
    Write-Host "`nİlk 5 kayıt:"
    $sonuclar | Select-Object -First 5 | ConvertTo-Json -Depth 5

    # Tümünü dosyaya kaydet (DB'ye yazmadan inceleme için)
    $sonuclar | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $PSScriptRoot "gemini-test-50.json") -Encoding utf8
    Write-Host "`nTüm sonuçlar etl/gemini-test-50.json dosyasına kaydedildi."
} catch {
    Write-Host "HATA: $_"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd()
    }
}
