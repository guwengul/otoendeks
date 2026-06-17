# match-sifir-tsb.ps1
# sifir_fiyatlar ↔ kasko_degerleri (2026) eşleştirme
# Çıktı: etl/sifir-tsb-eslestirme.json

$OUT = "$PSScriptRoot\sifir-tsb-eslestirme.json"

$SUPABASE = "https://vojpmfhtddkkbcwqjrvg.supabase.co"
$KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvanBtZmh0ZGRra2Jjd3FqcnZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzE2NTUsImV4cCI6MjA5NzIwNzY1NX0.w_dQoqlIWjyEzCWA7rcgDkMt9-3BjwesCPbZ3d0tvjQ"
$H = @{ "apikey" = $KEY }

# sifir_fiyatlar marka → TSB marka_adi normalize
$MARKA_NORM = @{
    "Alfa Romeo"    = "ALFA ROMEO"
    "Audi"          = "AUDI"
    "BMW"           = "BMW"
    "Byd"           = "BYD"
    "Citroen"       = "CITROEN"
    "Cupra"         = "CUPRA"
    "Dacia"         = "DACIA"
    "DS Automobiles"= "DS"
    "Fiat"          = "FIAT"
    "Ford"          = "FORD"
    "Honda"         = "HONDA"
    "Hyundai"       = "HYUNDAI"
    "Isuzu"         = "ISUZU"
    "Jeep"          = "JEEP"
    "Kia"           = "KIA"
    "Land Rover"    = "LAND ROVER"
    "Lexus"         = "LEXUS"
    "Maserati"      = "MASERATI"
    "Mercedes"      = "MERCEDES"
    "MG"            = "MG"
    "Mini"          = "MINI"
    "Nissan"        = "NISSAN"
    "Opel"          = "OPEL"
    "Peugeot"       = "PEUGEOT"
    "Renault"       = "RENAULT"
    "Seat"          = "SEAT"
    "Skoda"         = "SKODA"
    "Ssangyong"     = "KGMOBILITY"
    "Subaru"        = "SUBARU"
    "Suzuki"        = "SUZUKI"
    "Tesla"         = "TESLA"
    "Togg"          = "TOGG"
    "Toyota"        = "TOYOTA"
    "Volkswagen"    = "VOLKSWAGEN"
    "Volvo"         = "VOLVO"
    # Bunlar TSB'de yok:
    # Gazelle, DFSK, Voyah, Maxus, Chery, Nieve, Skywell, Leapmotor
}

# HP çıkar — "150 hp", "150", "286 HP" gibi
function Extract-HP($text) {
    if ($text -match '\b(\d{2,4})\s*[Hh][Pp]\b') { return [int]$Matches[1] }
    if ($text -match '\b(\d{2,4})\s*[Kk][Ww]\b') { return [int]([int]$Matches[1] * 1.341) }  # kW → HP
    # Sayıları tara, HP olabilecek (75-1200 arası)
    $nums = [regex]::Matches($text, '\b(\d{2,4})\b') | ForEach-Object { [int]$_.Groups[1].Value }
    return ($nums | Where-Object { $_ -ge 75 -and $_ -le 1200 } | Select-Object -Last 1)
}

# Model adı normalize: "A3 Sedan" → "a3 sedan", baştaki boşluklar temizle
function Norm($s) { ($s -replace '\s+', ' ').Trim().ToLower() }

# Model kelimelerinin kaçı eşleşiyor
function WordOverlap($a, $b) {
    $wa = ($a -split '\s+') | Where-Object { $_.Length -ge 2 }
    $wb = ($b -split '\s+') | Where-Object { $_.Length -ge 2 }
    $common = $wa | Where-Object { $wb -contains $_ }
    return $common.Count
}

# ── Veri çek ──────────────────────────────────────────────────────────────────
Write-Host "sifir_fiyatlar çekiliyor..." -ForegroundColor Yellow
$sifir = @(); $off = 0
do {
    $r = Invoke-RestMethod "$SUPABASE/rest/v1/sifir_fiyatlar?select=id,marka_adi,model_adi,versiyon,liste_fiyati,kampanya_fiyati&limit=1000&offset=$off" -Headers $H
    $sifir += $r; $off += 1000
} while ($r.Count -eq 1000)
Write-Host "  $($sifir.Count) satır" -ForegroundColor Green

Write-Host "kasko_degerleri 2026 çekiliyor..." -ForegroundColor Yellow
$exclude = "ZIRAI TRAKTOR,MOTORSIKLET,OTOYOL\IVECO\FIAT,MAN"
$kasko = @(); $off = 0
do {
    $r = Invoke-RestMethod "$SUPABASE/rest/v1/kasko_degerleri?model_yili=eq.2026&snapshot_month=eq.2026-06-01&marka_adi=not.in.($exclude)&select=tip_kodu,tip_adi,marka_adi,deger&limit=1000&offset=$off" -Headers $H
    $kasko += $r; $off += 1000
} while ($r.Count -eq 1000)
Write-Host "  $($kasko.Count) satır" -ForegroundColor Green

# kasko: marka → list ve fiyat → list indeksleri
$kaskoByMarka = @{}
$kaskoByFiyat = @{}   # "MARKA|fiyat" → tip_kodu list

foreach ($k in $kasko) {
    if (-not $kaskoByMarka.ContainsKey($k.marka_adi)) { $kaskoByMarka[$k.marka_adi] = @() }
    $kaskoByMarka[$k.marka_adi] += $k

    $fiyatKey = "$($k.marka_adi)|$($k.deger)"
    if (-not $kaskoByFiyat.ContainsKey($fiyatKey)) { $kaskoByFiyat[$fiyatKey] = @() }
    $kaskoByFiyat[$fiyatKey] += $k
}

# ── Eşleştirme ────────────────────────────────────────────────────────────────
$results = @()

foreach ($s in $sifir) {
    $tsbMarka = $MARKA_NORM[$s.marka_adi]
    $result = [ordered]@{
        sifir_id    = $s.id
        marka_adi   = $s.marka_adi
        model_adi   = $s.model_adi
        versiyon    = $s.versiyon
        liste_fiyati= $s.liste_fiyati
        tip_kodu    = $null
        tip_adi     = $null
        yontem      = $null
        skor        = 0
    }

    if (-not $tsbMarka) {
        $result.yontem = "no_tsb_brand"
        $results += $result
        continue
    }

    # ── Yöntem 1: Fiyat eşleşmesi ──────────────────────────────────────────
    $fiyatKey = "$tsbMarka|$($s.liste_fiyati)"
    $fiyatMatches = $kaskoByFiyat[$fiyatKey]

    if ($fiyatMatches -and $fiyatMatches.Count -eq 1) {
        $result.tip_kodu = $fiyatMatches[0].tip_kodu
        $result.tip_adi  = $fiyatMatches[0].tip_adi
        $result.yontem   = "fiyat_exact"
        $result.skor     = 100
        $results += $result
        continue
    }

    # Kampanya fiyatıyla da dene
    if ($s.kampanya_fiyati -gt 0) {
        $kampKey = "$tsbMarka|$($s.kampanya_fiyati)"
        $kampMatches = $kaskoByFiyat[$kampKey]
        if ($kampMatches -and $kampMatches.Count -eq 1) {
            $result.tip_kodu = $kampMatches[0].tip_kodu
            $result.tip_adi  = $kampMatches[0].tip_adi
            $result.yontem   = "fiyat_kampanya"
            $result.skor     = 95
            $results += $result
            continue
        }
    }

    # ── Yöntem 2: HP + model adı eşleşmesi ─────────────────────────────────
    $candidates = $kaskoByMarka[$tsbMarka]
    if (-not $candidates) {
        $result.yontem = "no_kasko_data"
        $results += $result
        continue
    }

    $sifirHP  = Extract-HP "$($s.model_adi) $($s.versiyon)"
    $sifirNorm = Norm "$($s.model_adi) $($s.versiyon)"

    $bestScore = -1; $bestMatch = $null

    foreach ($k in $candidates) {
        $kaskoHP   = Extract-HP $k.tip_adi
        $kaskoNorm = Norm $k.tip_adi
        $score = 0

        # HP eşleşmesi (en kritik)
        if ($sifirHP -and $kaskoHP -and $sifirHP -eq $kaskoHP)        { $score += 40 }
        elseif ($sifirHP -and $kaskoHP -and [Math]::Abs($sifirHP - $kaskoHP) -le 5) { $score += 20 }

        # Kelime örtüşmesi
        $overlap = WordOverlap $sifirNorm $kaskoNorm
        $score += ($overlap * 8)

        # Yakıt tipi uyumu
        $sifirFuel = if ($sifirNorm -match 'dizel|diesel|tdi|cdi|hdi|dci|crdi') { 'd' }
                     elseif ($sifirNorm -match 'elektrik|electric|e-tron|kwh|bev') { 'e' }
                     elseif ($sifirNorm -match 'hybrid|hibr|phev') { 'h' }
                     else { 'p' }
        $kaskoFuel = if ($kaskoNorm -match 'tdi|cdi|hdi|dci|crdi|bluehdi') { 'd' }
                     elseif ($kaskoNorm -match 'e-tron|electric|kwh|bev') { 'e' }
                     elseif ($kaskoNorm -match 'hybrid|hibr|phev|mhev') { 'h' }
                     else { 'p' }
        if ($sifirFuel -eq $kaskoFuel) { $score += 15 }
        else { $score -= 20 }

        # Kasa tipi
        $sifirBody = if ($sifirNorm -match 'sedan') {'sedan'} elseif ($sifirNorm -match 'sportback|hatchback') {'hb'} elseif ($sifirNorm -match 'avant|estate|sw|break|variant|touring') {'wagon'} else {'other'}
        $kaskoBody = if ($kaskoNorm -match 'sedan') {'sedan'} elseif ($kaskoNorm -match 'sportback|hatchback') {'hb'} elseif ($kaskoNorm -match 'avant|estate|sw|break|variant|touring') {'wagon'} else {'other'}
        if ($sifirBody -ne 'other' -and $kaskoBody -ne 'other') {
            if ($sifirBody -eq $kaskoBody) { $score += 10 } else { $score -= 15 }
        }

        if ($score -gt $bestScore) { $bestScore = $score; $bestMatch = $k }
    }

    if ($bestMatch -and $bestScore -ge 35) {
        $result.tip_kodu = $bestMatch.tip_kodu
        $result.tip_adi  = $bestMatch.tip_adi
        $result.yontem   = "hp_model"
        $result.skor     = $bestScore
    } else {
        $result.yontem = "no_match"
        $result.skor   = $bestScore
    }
    $results += $result
}

# ── Özet ──────────────────────────────────────────────────────────────────────
$results | ConvertTo-Json -Depth 5 | Out-File $OUT -Encoding UTF8

$total   = $results.Count
$exact   = ($results | Where-Object { $_.yontem -like "fiyat*" }).Count
$hpModel = ($results | Where-Object { $_.yontem -eq "hp_model" }).Count
$noMatch = ($results | Where-Object { $_.yontem -in @("no_match","no_kasko_data","no_tsb_brand") }).Count

Write-Host "`n=== SONUÇ ===" -ForegroundColor Cyan
Write-Host "Toplam          : $total"
Write-Host "Fiyat eşleşmesi : $exact   ($(  [int]($exact/$total*100))%)" -ForegroundColor Green
Write-Host "HP+Model        : $hpModel  ($([int]($hpModel/$total*100))%)" -ForegroundColor Yellow
Write-Host "Eşleşmedi       : $noMatch  ($([int]($noMatch/$total*100))%)" -ForegroundColor Red

Write-Host "`nEşleşmeyen markalar:"
$results | Where-Object { $_.yontem -in @("no_match","no_kasko_data","no_tsb_brand","no_model") } |
    Group-Object marka_adi | Sort-Object Count -Descending |
    ForEach-Object { "  $($_.Name): $($_.Count) ($($_.Group[0].yontem))" }

Write-Host "`nÇıktı: $OUT" -ForegroundColor Cyan
