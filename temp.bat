:: Open Command Prompt as Administrator
:: This will delete temporary files in the user's temp folder

echo Cleaning temporary files...
del /q /f /s %temp%\*
rd /s /q %temp%
md %temp%
echo Temporary files cleared!
pause