@echo off
cd /d "%~dp0"
if not exist "node_modules\next\package.json" (
  echo Configuracao inicial: instalando dependencias...
  call npm.cmd install
  if errorlevel 1 (
    echo A instalacao falhou. Informe o erro para continuarmos.
    pause
    exit /b 1
  )
)
echo.
echo Abra http://127.0.0.1:3000 no navegador.
echo As alteracoes aparecerao automaticamente. Mantenha esta janela aberta.
echo.
call npm.cmd run dev
pause
