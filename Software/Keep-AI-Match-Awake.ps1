param([Parameter(Mandatory = $true)][int]$TaskProcessId)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System.Runtime.InteropServices;
public static class AIMatchPower {
    [DllImport("kernel32.dll")]
    public static extern uint SetThreadExecutionState(uint state);
}
'@
$taskProcess = [System.Diagnostics.Process]::GetProcessById($TaskProcessId)
try {
    if ([AIMatchPower]::SetThreadExecutionState([uint32]2147483649) -eq 0) {
        throw 'Windows did not accept the temporary keep-awake request.'
    }
    while (-not $taskProcess.HasExited) {
        [System.Threading.Thread]::Sleep(10000)
    }
} finally {
    [void][AIMatchPower]::SetThreadExecutionState([uint32]2147483648)
    $taskProcess.Dispose()
}
