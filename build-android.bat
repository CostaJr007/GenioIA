@echo off
echo ====================================
echo   GenioIA - Build Android APK
echo ====================================
echo.

echo [1/3] Verificando dependencias...
call npm install
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)

echo.
echo [2/3] Limpando build anterior...
cd android
call gradlew.bat clean
if errorlevel 1 (
    echo ERRO: Falha ao limpar build
    pause
    exit /b 1
)

echo.
echo [3/3] Gerando APK debug...
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo ERRO: Falha ao gerar APK
    pause
    exit /b 1
)

echo.
echo ====================================
echo   BUILD CONCLUIDO COM SUCESSO!
echo ====================================
echo.
echo APK gerado em: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Para rodar no Android Studio:
echo 1. Abra o Android Studio
echo 2. Abra o projeto: D:\GenioIA\android
echo 3. Selecione um emulador ou dispositivo
echo 4. Clique em Run (Shift+F10)
echo.
echo Ou instale o APK diretamente:
echo adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
