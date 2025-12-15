@echo off
REM EPQ Rate Logger - Windows Batch Wrapper
REM This script is designed to be called by Windows Task Scheduler
REM 
REM Task Scheduler Settings:
REM   Program/script: C:\Users\Gabriel Marie\Documents\GitHub\GabrielMarie\phyton\run_epq_logger.bat
REM   Start in:       C:\Users\Gabriel Marie\Documents\GitHub\GabrielMarie\phyton

cd /d "%~dp0"
REM Change to the script's directory (handles spaces in path)

REM Activate virtual environment and run the logger
call ..\\.venv\\Scripts\\activate.bat
python.exe epq_rate.py

REM Capture exit code
set EXIT_CODE=%ERRORLEVEL%

REM Log summary to console (for Task Scheduler history)
if %EXIT_CODE% equ 0 (
    echo [%date% %time%] EPQ Logger succeeded
) else (
    echo [%date% %time%] EPQ Logger failed with exit code %EXIT_CODE%
)

exit /b %EXIT_CODE%
