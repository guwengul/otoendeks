# scrape-autodata.ps1
# auto-data.net'ten 2026 model araçların teknik spesifikasyonlarını çeker
# Çıktı: etl/autodata-specs.json

$BASE     = "https://www.auto-data.net"
$OUT      = "$PSScriptRoot\autodata-specs.json"
$DELAY_MS = 1500

$BRAND_MAP = @{
    "AUDI"           = "audi-brand-41"
    "BMW"            = "bmw-brand-86"
    "MERCEDES"       = "mercedes-benz-brand-138"
    "VOLKSWAGEN"     = "volkswagen-brand-80"
    "TOYOTA"         = "toyota-brand-40"
    "FORD"           = "ford-brand-72"
    "RENAULT"        = "renault-brand-99"
    "RENAULT (OYAK)" = "renault-brand-99"
    "FIAT"           = "fiat-brand-67"
    "TOFAS-FIAT"     = "fiat-brand-67"
    "OPEL"           = "opel-brand-19"
    "SKODA"          = "skoda-brand-154"
    "PEUGEOT"        = "peugeot-brand-49"
    "CITROEN"        = "citroen-brand-166"
    "HYUNDAI"        = "hyundai-brand-147"
    "KIA"            = "kia-brand-23"
    "NISSAN"         = "nissan-brand-4"
    "VOLVO"          = "volvo-brand-85"
    "VOLVO-TR"       = "volvo-brand-85"
    "PORSCHE"        = "porsche-brand-64"
    "LAND ROVER"     = "land-rover-brand-48"
    "RANGE ROVER"    = "land-rover-brand-48"
    "BENTLEY"        = "bentley-brand-66"
    "LEXUS"          = "lexus-brand-58"
    "MINI"           = "mini-brand-168"
    "MITSUBISHI"     = "mitsubishi-brand-173"
    "HONDA"          = "honda-brand-127"
    "SUZUKI"         = "suzuki-brand-194"
    "TESLA"          = "tesla-brand-197"
    "ALFA ROMEO"     = "alfa-romeo-brand-11"
    "BYD"            = "byd-brand-116"
    "MG"             = "mg-brand-153"
    "DS"             = "ds-brand-198"
    "DACIA"          = "dacia-brand-181"
    "SEAT"           = "seat-brand-144"
    "CUPRA"          = "cupra-brand-256"
    "CHEVROLET"      = "chevrolet-brand-156"
    "CHRYSLER"       = "chrysler-brand-161"
    "MASERATI"       = "maserati-brand-108"
    "LAMBORGHINI"    = "lamborghini-brand-38"
    "FERRARI"        = "ferrari-brand-62"
    "GMC"            = "gmc-brand-97"
    "CADILLAC"       = "cadillac-brand-121"
    "SUBARU"         = "subaru-brand-189"
    "ROLLS-ROYCE"    = "rolls-royce-brand-109"
    "ALPINE"         = "alpine-brand-171"
    "KGMOBILITY"     = "ssangyong-brand-130"
}

function Fetch-Page($url) {
    try {
        $r = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        Start-Sleep -Milliseconds $DELAY_MS
        return $r.Content
    } catch {
        Write-Warning "HATA: $url"
        Start-Sleep -Milliseconds ($DELAY_MS * 2)
        return $null
    }
}

# Variant linki mi? (generation/model/brand değil, hp veya kwh içeriyor ya da spec sayfası)
function Is-VariantLink($url) {
    return ($url -match '/en/.+-(hp|kwh).+-\d{4,6}$') -or
           ($url -match '/en/.+-\d{5,6}$' -and $url -notmatch 'generation-|model-\d|brand-\d')
}

function Get-VariantLinks($html, $brandPrefix) {
    [regex]::Matches($html, "href=""(/en/$brandPrefix[^""]+)""") |
        ForEach-Object { $_.Groups[1].Value } |
        Where-Object { Is-VariantLink $_ } |
        Sort-Object -Unique
}

function Parse-SpecPage($html) {
    if (-not $html) { return $null }
    $spec = @{}
    $rows = [regex]::Matches($html,
        '<tr>\s*<th[^>]*>\s*(.*?)\s*</th>\s*<td[^>]*>\s*(.*?)\s*</td>',
        [System.Text.RegularExpressions.RegexOptions]::Singleline)
    foreach ($row in $rows) {
        $rawKey = [regex]::Replace($row.Groups[1].Value, '<[^>]+>', '').Trim()
        $rawVal = [regex]::Replace($row.Groups[2].Value, '<[^>]+>', '').Trim() -replace '\s+', ' '
        if (-not $rawKey -or -not $rawVal) { continue }
        # Basit anahtar çıkar: son kelime(ler) veya doğrudan anahtar
        $key = $rawKey -replace '^(What is|How many|How much|How long|How wide|How fast|How ECO|Brand|Model|Generation|Modification|Start of|Powertrain|Body type|Seats|Doors|Combined|CO2|Fuel Type|Acceleration|Maximum|Engine|Cylinders|Drivetrain|Gears|Curb|Gross|Trunk).*', '$1'
        # Temiz anahtar için son kelimeyi al
        if ($rawKey -match '\?\s*$') {
            # Soru formatındaki satır — anahtar genellikle son segment
            if ($rawKey -match 'fuel economy|fuel consumption') { $key = 'fuel_consumption' }
            elseif ($rawKey -match 'ECO|CO2') { $key = 'co2_emissions' }
            elseif ($rawKey -match 'fast|speed') { $key = 'max_speed_0100' }
            elseif ($rawKey -match 'power') { $key = 'power_torque' }
            elseif ($rawKey -match 'engine size') { $key = 'engine_displacement' }
            elseif ($rawKey -match 'cylinders') { $key = 'cylinders' }
            elseif ($rawKey -match 'drivetrain') { $key = 'drivetrain' }
            elseif ($rawKey -match 'long') { $key = 'length_mm' }
            elseif ($rawKey -match 'wide') { $key = 'width_mm' }
            elseif ($rawKey -match 'curb weight') { $key = 'curb_weight_kg' }
            elseif ($rawKey -match 'gross weight') { $key = 'gross_weight_kg' }
            elseif ($rawKey -match 'trunk|boot') { $key = 'trunk_volume_l' }
            elseif ($rawKey -match 'gears|gearbox') { $key = 'gearbox' }
            elseif ($rawKey -match 'body type') { $key = 'body_type' }
            else { $key = $rawKey -replace '^.*?,\s*', '' -replace '\?.*', '' -replace '^\s+|\s+$', '' }
        }
        $spec[$key] = $rawVal
    }
    return $spec
}

function Parse-TipAdi($tipAdi) {
    $hp = $null
    $nums = [regex]::Matches($tipAdi, '\b(\d{2,4})\b') | ForEach-Object { [int]$_.Groups[1].Value }
    $hp = $nums | Where-Object { $_ -ge 70 -and $_ -le 1200 } | Select-Object -Last 1

    $fuel = "petrol"
    if ($tipAdi -match '\bE-TRON\b|\bELEKTR|\bEV\b|\bBEV\b|\bKWH\b') { $fuel = "electric" }
    elseif ($tipAdi -match '\bHYBRID\b|\bHIBR|\bPHEV\b|\bMHEV\b|\bPLUG.IN\b') { $fuel = "hybrid" }
    elseif ($tipAdi -match '\bTDI\b|\bDIZEL\b|\bCDI\b|\bBLUEHDI\b|\bDCI\b|\bHDI\b|\bCRDI\b|\bDTI\b|\bJTD\b|\bBLUETDI\b|\bD\d\b') { $fuel = "diesel" }

    $body = "suv"
    if ($tipAdi -match '\bSEDAN\b|\bSALOON\b') { $body = "sedan" }
    elseif ($tipAdi -match '\bSPORTBACK\b|\bHATCHBACK\b|\bHB\b|\b5P\b|\b3P\b') { $body = "hatchback" }
    elseif ($tipAdi -match '\bAVANT\b|\bESTATE\b|\bTOURING\b|\bCOMBI\b|\bVARIANT\b|\bBREAK\b|\bSW\b|\bUNIVERSAL\b') { $body = "wagon" }
    elseif ($tipAdi -match '\bCOUPE\b|\bCOUPÉ\b|\bFASTBACK\b') { $body = "coupe" }
    elseif ($tipAdi -match '\bCABRIO\b|\bCONVERT\b|\bROADSTER\b|\bSPIDER\b|\bSPYDER\b|\bTARGA\b') { $body = "convertible" }

    return @{ hp = $hp; fuel = $fuel; body = $body }
}

function Match-Score($variantUrl, $parsed) {
    $u = $variantUrl.ToLower()
    $score = 0

    if ($parsed.hp -and $u -match "-$($parsed.hp)hp") { $score += 15 }
    elseif ($parsed.hp -and $u -match "\b$($parsed.hp)\b") { $score += 8 }

    switch ($parsed.fuel) {
        "electric" { if ($u -match 'e-tron|electric|kwh') { $score += 6 } else { $score -= 5 } }
        "diesel"   { if ($u -match 'tdi|cdi|hdi|dci|diesel|crdi') { $score += 6 } else { $score -= 3 } }
        "hybrid"   { if ($u -match 'phev|plug-in|hybrid') { $score += 4 } }
        "petrol"   { if ($u -notmatch 'tdi|cdi|hdi|dci|e-tron|kwh') { $score += 2 } }
    }

    switch ($parsed.body) {
        "sedan"      { if ($u -match 'sedan|saloon') { $score += 4 } elseif ($u -match 'sportback|avant|estate|wagon') { $score -= 3 } }
        "hatchback"  { if ($u -match 'sportback|hatchback|3p|5p') { $score += 4 } }
        "wagon"      { if ($u -match 'avant|estate|touring|combi|variant|break|sw') { $score += 4 } }
        "coupe"      { if ($u -match 'coupe|fastback') { $score += 4 } }
        "convertible"{ if ($u -match 'cabrio|convert|roadster|spider') { $score += 4 } }
        "suv"        { if ($u -notmatch 'sedan|avant|estate|sportback|coupe|cabrio') { $score += 2 } }
    }

    return $score
}

# ── Ana akış ──────────────────────────────────────────────────────────────────
Write-Host "=== auto-data.net Spec Scraper ===" -ForegroundColor Cyan

$SUPABASE_URL = "https://vojpmfhtddkkbcwqjrvg.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvanBtZmh0ZGRra2Jjd3FqcnZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzE2NTUsImV4cCI6MjA5NzIwNzY1NX0.w_dQoqlIWjyEzCWA7rcgDkMt9-3BjwesCPbZ3d0tvjQ"
$apiHeaders = @{ "apikey" = $ANON_KEY }
$exclude = "ZIRAI TRAKTOR,MOTORSIKLET,OTOYOL\IVECO\FIAT,MAN"

Write-Host "Tipler çekiliyor..." -ForegroundColor Yellow
$tips = @(); $offset = 0
do {
    $r = Invoke-RestMethod "$SUPABASE_URL/rest/v1/kasko_degerleri?model_yili=eq.2026&snapshot_month=eq.2026-06-01&marka_adi=not.in.($exclude)&select=tip_kodu,tip_adi,marka_adi,deger&order=marka_adi.asc,tip_adi.asc&limit=1000&offset=$offset" -Headers $apiHeaders
    $tips += $r; $offset += 1000
} while ($r.Count -eq 1000)
Write-Host "$($tips.Count) tip yüklendi" -ForegroundColor Green

# Resume: mevcut sonuçları yükle
$results = [ordered]@{}
if (Test-Path $OUT) {
    $existing = Get-Content $OUT -Raw | ConvertFrom-Json
    foreach ($item in $existing) {
        if ($item.PSObject.Properties['tip_kodu']) {
            $results[$item.tip_kodu.ToString()] = $item
        }
    }
    Write-Host "Devam: $($results.Count) mevcut sonuç yüklendi" -ForegroundColor Cyan
}

# Her marka için brand sayfası cache
$brandCache = @{}   # brandSlug → model links
$genCache   = @{}   # genUrl → variant links

$saved = 0
$brandGroups = $tips | Group-Object marka_adi

foreach ($bg in $brandGroups) {
    $tsbBrand = $bg.Name
    if (-not $BRAND_MAP.ContainsKey($tsbBrand)) {
        Write-Host "[$tsbBrand] mapping yok, atlanıyor" -ForegroundColor DarkGray
        foreach ($tip in $bg.Group) {
            if (-not $results.Contains($tip.tip_kodu.ToString())) {
                $results[$tip.tip_kodu.ToString()] = [PSCustomObject]@{ tip_kodu=$tip.tip_kodu; tip_adi=$tip.tip_adi; marka_adi=$tsbBrand; status="no_brand_map" }
            }
        }
        continue
    }

    $brandSlug = $BRAND_MAP[$tsbBrand]
    $brandPrefix = ($brandSlug -split '-brand-')[0]
    Write-Host "`n=== $tsbBrand → $brandPrefix ($($bg.Group.Count) tip) ===" -ForegroundColor Magenta

    # Brand sayfasından model linklerini çek (cache)
    if (-not $brandCache.ContainsKey($brandSlug)) {
        $brandHtml = Fetch-Page "$BASE/en/$brandSlug"
        if ($brandHtml) {
            $brandCache[$brandSlug] = [regex]::Matches($brandHtml, 'href="(/en/[a-z0-9\-]+-model-\d+)"') |
                ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
        } else { $brandCache[$brandSlug] = @() }
    }
    $modelLinks = $brandCache[$brandSlug]

    foreach ($tip in $bg.Group) {
        $tk = $tip.tip_kodu.ToString()
        if ($results.Contains($tk) -and $results[$tk].status -eq "ok") {
            Write-Host "  [SKIP] $($tip.tip_adi)" -ForegroundColor DarkGray
            continue
        }

        $parsed = Parse-TipAdi $tip.tip_adi
        Write-Host "  [$($tip.tip_kodu)] $($tip.tip_adi)" -ForegroundColor White -NoNewline
        Write-Host " hp:$($parsed.hp) $($parsed.fuel) $($parsed.body)" -ForegroundColor Gray

        # Model adı: tip_adi'nin ilk 1-2 kelimesi (marka adı hariç değil, TSB'de marka yok)
        $words = $tip.tip_adi.ToLower() -split '\s+'
        $modelWord = $words[0] -replace '[^a-z0-9\-]', ''

        $candidateModels = $modelLinks | Where-Object {
            $_ -match "/$modelWord-" -or $_ -match "-$modelWord-" -or $_ -match "/$brandPrefix-$modelWord"
        }
        # 2 kelime dene
        if (-not $candidateModels -and $words.Count -ge 2) {
            $m2 = ($words[0..1] -join '-') -replace '[^a-z0-9\-]', ''
            $candidateModels = $modelLinks | Where-Object { $_ -match $m2 }
        }
        if (-not $candidateModels) {
            Write-Host "    → model bulunamadı" -ForegroundColor Yellow
            $results[$tk] = [PSCustomObject]@{ tip_kodu=$tip.tip_kodu; tip_adi=$tip.tip_adi; marka_adi=$tsbBrand; status="no_model" }
            continue
        }

        $bestScore = -1; $bestVariantUrl = $null

        foreach ($modelLink in ($candidateModels | Select-Object -First 2)) {
            # Model → generation listesi
            $modelHtml = Fetch-Page "$BASE$modelLink"
            if (-not $modelHtml) { continue }

            $genLinks = [regex]::Matches($modelHtml, 'href="(/en/[a-z0-9\-]+-generation-\d+)"') |
                        ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
            $recentGens = @($genLinks | Where-Object { $_ -match '202[0-9]' })
            if (-not $recentGens) { $recentGens = @($genLinks | Select-Object -Last 2) }

            foreach ($genLink in ($recentGens | Select-Object -Last 3)) {
                if (-not $genCache.ContainsKey($genLink)) {
                    $genHtml = Fetch-Page "$BASE$genLink"
                    if ($genHtml) {
                        $genCache[$genLink] = [regex]::Matches($genHtml, "href=""(/en/$brandPrefix[^""]+)""") |
                            ForEach-Object { $_.Groups[1].Value } |
                            Where-Object { $_ -match '-\d{5,6}$' -and $_ -notmatch 'generation-|brand-' } |
                            Sort-Object -Unique
                    } else { $genCache[$genLink] = @() }
                }
                $variantUrls = $genCache[$genLink]

                foreach ($vUrl in $variantUrls) {
                    $score = Match-Score $vUrl $parsed
                    if ($score -gt $bestScore) {
                        $bestScore = $score
                        $bestVariantUrl = $vUrl
                    }
                }
            }
        }

        if ($bestVariantUrl -and $bestScore -ge 8) {
            Write-Host "    ✓ ($bestScore) $bestVariantUrl" -ForegroundColor Green
            $specHtml = Fetch-Page "$BASE$bestVariantUrl"
            $specRows = [regex]::Matches($specHtml,
                '<tr>\s*<th[^>]*>\s*(.*?)\s*</th>\s*<td[^>]*>\s*(.*?)\s*</td>',
                [System.Text.RegularExpressions.RegexOptions]::Singleline)
            $specs = @{}
            foreach ($row in $specRows) {
                $k = [regex]::Replace($row.Groups[1].Value, '<[^>]+>', '').Trim() -replace '\s+', ' '
                $v = [regex]::Replace($row.Groups[2].Value, '<[^>]+>', '').Trim() -replace '\s+', ' '
                if ($k -and $v) { $specs[$k] = $v }
            }
            $results[$tk] = [PSCustomObject]@{
                tip_kodu     = $tip.tip_kodu
                tip_adi      = $tip.tip_adi
                marka_adi    = $tsbBrand
                deger_tl     = $tip.deger
                status       = "ok"
                autodata_url = "$BASE$bestVariantUrl"
                match_score  = $bestScore
                specs        = $specs
            }
        } else {
            Write-Host "    ✗ eşleşme yok (max $bestScore)" -ForegroundColor Yellow
            $results[$tk] = [PSCustomObject]@{ tip_kodu=$tip.tip_kodu; tip_adi=$tip.tip_adi; marka_adi=$tsbBrand; status="no_match" }
        }

        $saved++
        if ($saved % 15 -eq 0) {
            @($results.Values) | ConvertTo-Json -Depth 8 | Out-File $OUT -Encoding UTF8
            Write-Host "  [KAYDEDILDI $($results.Count) sonuç]" -ForegroundColor Cyan
        }
    }
}

@($results.Values) | ConvertTo-Json -Depth 8 | Out-File $OUT -Encoding UTF8

Write-Host "`n=== TAMAMLANDI ===" -ForegroundColor Green
$ok   = @($results.Values | Where-Object { $_.status -eq "ok" }).Count
$fail = @($results.Values | Where-Object { $_.status -ne "ok" }).Count
Write-Host "Başarılı: $ok | Diğer: $fail | Toplam: $($results.Count)" -ForegroundColor Cyan
Write-Host "Çıktı: $OUT" -ForegroundColor Cyan
