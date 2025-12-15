# EPQ Rate Logger - Windows Task Scheduler Setup Script
# 
# This script automates the creation of a Windows Task Scheduler job
# to run the EPQ rate logger daily.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File setup_task_scheduler.ps1
#
# REQUIRES: Administrator privileges

param(
    [ValidateSet('Create', 'Delete', 'Test')]
    [string]$Action = 'Create',
    
    [int]$Hour = 9,
    [int]$Minute = 0
)

$TaskName = "EPQ_Rate_Logger"
$TaskPath = "\EPQ_Logger\"
$FullTaskName = "$TaskPath$TaskName"

$ScriptPath = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$BatchFile = Join-Path $ScriptPath "run_epq_logger.bat"
$Python = Join-Path $ScriptPath "..\\.venv\\Scripts\\python.exe"

Write-Host "EPQ Rate Logger - Task Scheduler Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Script directory: $ScriptPath"
Write-Host "Batch file: $BatchFile"
Write-Host ""

# Check if running as admin
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $IsAdmin) {
    Write-Host "ERROR: This script requires Administrator privileges" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator" -ForegroundColor Red
    exit 1
}

switch ($Action) {
    'Create' {
        Write-Host "Creating Task Scheduler job..." -ForegroundColor Yellow
        
        # Check if task already exists
        $ExistingTask = Get-ScheduledTask -TaskName $TaskName -TaskPath $TaskPath -ErrorAction SilentlyContinue
        if ($ExistingTask) {
            Write-Host "Task already exists. Removing old version..." -ForegroundColor Yellow
            Unregister-ScheduledTask -TaskName $TaskName -TaskPath $TaskPath -Confirm:$false
        }
        
        # Create task trigger (daily at specified time)
        $Trigger = New-ScheduledTaskTrigger -Daily -At "$($Hour):$($Minute:d2):00"
        
        # Create task action (run batch file)
        $Action = New-ScheduledTaskAction `
            -Execute $BatchFile `
            -WorkingDirectory $ScriptPath
        
        # Create task settings (allow multiple instances, run with highest privileges)
        $Settings = New-ScheduledTaskSettingsSet `
            -AllowStartIfOnBatteries `
            -DontStopIfGoingOnBatteries `
            -StartWhenAvailable
        
        # Create the task
        Register-ScheduledTask `
            -TaskName $TaskName `
            -TaskPath $TaskPath `
            -Trigger $Trigger `
            -Action $Action `
            -Settings $Settings `
            -Description "Fetch EPQ interest rates daily and store in CSV" `
            -RunLevel Highest | Out-Null
        
        Write-Host "✓ Task created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Task Details:" -ForegroundColor Cyan
        Write-Host "  Name:     $FullTaskName"
        Write-Host "  Schedule: Daily at $($Hour):$($Minute:d2):00"
        Write-Host "  Batch:    $BatchFile"
        Write-Host ""
        Write-Host "To view the task:" -ForegroundColor Yellow
        Write-Host "  taskschd.msc"
        Write-Host "  Navigate to: Task Scheduler Library\EPQ_Logger\EPQ_Rate_Logger"
        Write-Host ""
    }
    
    'Delete' {
        Write-Host "Removing Task Scheduler job..." -ForegroundColor Yellow
        
        $ExistingTask = Get-ScheduledTask -TaskName $TaskName -TaskPath $TaskPath -ErrorAction SilentlyContinue
        if ($ExistingTask) {
            Unregister-ScheduledTask -TaskName $TaskName -TaskPath $TaskPath -Confirm:$false
            Write-Host "✓ Task removed successfully!" -ForegroundColor Green
        } else {
            Write-Host "Task not found." -ForegroundColor Yellow
        }
    }
    
    'Test' {
        Write-Host "Running test execution..." -ForegroundColor Yellow
        Write-Host ""
        
        # Run the batch file directly to test
        & $BatchFile
        
        Write-Host ""
        Write-Host "✓ Test execution complete. Check epq_rate.log for details." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Log file: $(Join-Path $ScriptPath 'epq_rate.log')" -ForegroundColor Gray
