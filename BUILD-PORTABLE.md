# Build Portable FikraPOS Application

## Quick Start - Build for Transfer to Another PC

### Option 1: Automated Build (Recommended)

Simply run this command in PowerShell:

```powershell
node build-portable.js
```

This will:
1. Install all dependencies
2. Build the application
3. Create a portable package

### Option 2: Manual Build

#### Step 1: Install Dependencies
```powershell
npm install
```

#### Step 2: Build the Application

**For Installer (Recommended):**
```powershell
npm run build-win
```
- Output: `dist\Fikra POS Setup 0.1.0.exe`
- This creates a Windows installer that can be transferred and installed on any Windows PC

**For Portable Folder:**
```powershell
npm run package-win
```
- Output: `release-builds\FikraPOS-win32-x64\`
- This creates a folder with the complete application

#### Step 3: Create ZIP for Transfer

**If you used build-win (installer):**
- Simply copy `dist\Fikra POS Setup 0.1.0.exe` to the other computer
- No ZIP needed - just run the installer

**If you used package-win (portable):**
1. Navigate to `release-builds` folder
2. Right-click on `FikraPOS-win32-x64` folder
3. Select "Send to > Compressed (zipped) folder"
4. Copy the ZIP to the other computer
5. Extract and run `FikraPOS.exe`

## What Gets Packaged?

The build includes:
- ✓ Electron runtime
- ✓ All Node.js dependencies
- ✓ Application code
- ✓ Database files
- ✓ Assets and resources

The target computer does **NOT** need:
- ✗ Node.js
- ✗ npm
- ✗ Any development tools

## System Requirements for Target PC

- Windows 7 or later (Windows 10 recommended)
- 4GB RAM minimum
- 500MB free disk space

## Default Login Credentials

```
Username: admin
Password: admin
Currency: EGP
Language: Arabic
```

## Troubleshooting

### Port Already in Use Error
The application now automatically finds an available port if 8001 is busy.

### Build Takes Too Long
The first build may take 5-10 minutes. This is normal as it downloads the Electron runtime.

### Missing Dependencies
Run `npm install` again if you see dependency errors.

## File Sizes

- Installer: ~150-200 MB
- Portable ZIP: ~200-250 MB
- Installed: ~300-350 MB

---

**For more information, see:**
- `HOW-TO-BUILD.txt` (Arabic instructions)
- `BUILD-GUIDE.md` (Detailed build guide)

