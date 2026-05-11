$files = Get-ChildItem -Path "src/app/api" -Recurse -Filter "route.ts"
foreach ($f in $files) {
  $content = [System.IO.File]::ReadAllText($f.FullName).Replace("`r`n", "`n")
  $old = $content
  
  # Fix literal \n in import lines  
  $content = $content -replace "from '@/lib/db'[^;]*\\n[^;]*", "@dummy"
  
  # Fix broken single import with getDB
  $content = $content -replace "import \{(.*?)\} from '@/lib/db'", 'import {$1,getDB} from "@/lib/db"'
  $content = $content -replace "\{,\s*getDB\}", "{getDB}"
  $content = $content -replace "getDB,\s*getDB", "getDB"
  
  # Fix inconsistent quotes
  $content = $content -replace "from `"@/lib/db`"", "from '@/lib/db'"
  $content = $content -replace "@dummy", "from '@/lib/db'"
  
  if ($content -ne $old) {
    [System.IO.File]::WriteAllText($f.FullName, $content)
    Write-Output "Fixed: $($f.Name)"
  }
}
Write-Output "Done"
