; ─────────────────────────────────────────────────────────────────────────────
; miniMall Studio — Windows NSIS Installer
; Wraps the self-contained pkg .exe (no Node needed). Per-user install, no UAC.
; A VBS launcher runs the (console) exe hidden, so there's no console window.
; Build (from this dir):  makensis installer.nsi
; ─────────────────────────────────────────────────────────────────────────────

Unicode True

!define APP_NAME       "miniMall Studio"
!define APP_VERSION    "0.1.1"
!define APP_PUBLISHER  "miniMall"
!define APP_URL        "https://github.com/eurobuddha/minima-core-apks"
!define EXE_NAME       "miniMallStudio.exe"
!define INSTALL_DIR    "$LOCALAPPDATA\${APP_NAME}"
!define UNINSTALL_KEY  "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

Name                   "${APP_NAME}"
OutFile                "..\release\miniMall-Studio-${APP_VERSION}-Setup.exe"
InstallDir             "${INSTALL_DIR}"
InstallDirRegKey       HKCU "${UNINSTALL_KEY}" "InstallLocation"
RequestExecutionLevel  user
SetCompressor /SOLID   lzma
ShowInstDetails        show

Icon          "icon.ico"
UninstallIcon "icon.ico"

VIProductVersion       "0.1.1.0"
VIAddVersionKey "ProductName"      "${APP_NAME}"
VIAddVersionKey "ProductVersion"   "${APP_VERSION}"
VIAddVersionKey "CompanyName"      "${APP_PUBLISHER}"
VIAddVersionKey "FileDescription"  "${APP_NAME} Installer"
VIAddVersionKey "LegalCopyright"   "Copyright 2026 miniMall"
VIAddVersionKey "FileVersion"      "${APP_VERSION}"

Page instfiles

Section "Install"

    SetOutPath "$INSTDIR"

    ; ── The self-contained studio binary + icon ──────────────────────────────
    File "/oname=${EXE_NAME}" "..\release\miniMall Studio.exe"
    File "icon.ico"

    ; ── VBS launcher: run the (console) exe HIDDEN, so no console window shows ──
    FileOpen  $0 "$INSTDIR\launch.vbs" w
    FileWrite $0 "Set sh = CreateObject($\"WScript.Shell$\")$\r$\n"
    FileWrite $0 "sh.CurrentDirectory = $\"$INSTDIR$\"$\r$\n"
    FileWrite $0 "sh.Run Chr(34) & $\"$INSTDIR\${EXE_NAME}$\" & Chr(34), 0, False$\r$\n"
    FileClose $0

    WriteUninstaller "$INSTDIR\Uninstall.exe"

    ; ── Add/Remove Programs ───────────────────────────────────────────────────
    WriteRegStr   HKCU "${UNINSTALL_KEY}" "DisplayName"     "${APP_NAME}"
    WriteRegStr   HKCU "${UNINSTALL_KEY}" "DisplayVersion"  "${APP_VERSION}"
    WriteRegStr   HKCU "${UNINSTALL_KEY}" "Publisher"       "${APP_PUBLISHER}"
    WriteRegStr   HKCU "${UNINSTALL_KEY}" "URLInfoAbout"    "${APP_URL}"
    WriteRegStr   HKCU "${UNINSTALL_KEY}" "InstallLocation" "$INSTDIR"
    WriteRegStr   HKCU "${UNINSTALL_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr   HKCU "${UNINSTALL_KEY}" "DisplayIcon"     "$INSTDIR\icon.ico"
    WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoModify"        1
    WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoRepair"        1

    ; ── Shortcuts (wscript runs launch.vbs → hidden) ──────────────────────────
    CreateShortcut "$DESKTOP\${APP_NAME}.lnk" \
        "$WINDIR\System32\wscript.exe" '"$INSTDIR\launch.vbs"' "$INSTDIR\icon.ico" 0
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" \
        "$WINDIR\System32\wscript.exe" '"$INSTDIR\launch.vbs"' "$INSTDIR\icon.ico" 0
    CreateShortcut "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"

    MessageBox MB_OK|MB_ICONINFORMATION \
        "${APP_NAME} installed!$\r$\n$\r$\nDouble-click the desktop shortcut — your browser opens at http://localhost:3456 to build a shop and export a .shop file."

SectionEnd

Section "Uninstall"
    ExecWait 'taskkill /F /IM ${EXE_NAME}' $0
    RMDir /r "$INSTDIR"
    Delete "$DESKTOP\${APP_NAME}.lnk"
    Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
    Delete "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk"
    RMDir  "$SMPROGRAMS\${APP_NAME}"
    DeleteRegKey HKCU "${UNINSTALL_KEY}"
SectionEnd
