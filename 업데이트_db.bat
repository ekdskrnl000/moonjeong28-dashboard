@echo off
setlocal

set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE="
if not defined PYTHON_EXE (
    for /f "delims=" %%I in ('where python 2^>nul') do if not defined PYTHON_EXE set "PYTHON_EXE=%%I"
)

if not defined PYTHON_EXE (
    echo [ERROR] Python 3 was not found.
    echo Please install Python 3.13, then run this file again.
    pause
    exit /b 1
)

echo ==================================================
echo Upload owner data from Excel to Firebase.
echo NOTE: To export dashboard memos to Excel, run download_db.bat instead.
echo ==================================================
"%PYTHON_EXE%" "%~dp0src\update_db.py"

if errorlevel 1 (
    echo.
    echo [FAILED] Please check the error message above.
) else (
    echo.
    echo [DONE] Firebase upload completed.
)
pause
