[README(1).md](https://github.com/user-attachments/files/31757885/README.1.md)
# 🌙 Lunatory

**Lunatory** is a self-hosted, multi-store inventory and logistics platform designed for restaurant and retail operations.

Version **v2.4.0** adds native application packages for Android, Linux, and Windows, centralized multi-store synchronization, expanded store management, role-based access, and fast PIN authentication for shared store devices.

---

## ✨ Highlights

- 📱 **Native Android APK**
- 🐧 **Native Debian `.deb` package**
- 🪟 **Windows Server Companion and Workstation installers**
- 🏪 **Multi-store management**
- 👥 **Admin and General Manager roles**
- 🔢 **4-digit PIN authentication**
- 🌐 **Self-hosted centralized synchronization**
- 🚚 **Configurable truck days, cutoff times, and order deadlines**

---

## 🏪 Multi-Store Management

Lunatory is built to support more than one store from a centralized system.

Store configuration can include:

- Store creation and management
- Store editing and deletion
- Delivery truck days
- Order cutoff times
- Order deadlines
- Store-level operational settings

This makes it possible to manage multiple locations while keeping each store's configuration separate.

---

## 👥 Roles & Permissions

### Administrator

Administrators have unrestricted server and local access.

Use the Admin role for:

- Server administration
- Store management
- System configuration
- User and access management
- Deployment and synchronization configuration

### General Manager

General Managers are focused on store operations.

GM access is intended for tasks such as:

- Store operations
- Par-level management
- US Foods ordering workflows
- Store inventory management

---

## 🔐 Universal PIN Authentication

Lunatory supports a **4-digit PIN login system** designed for shared tablets and workstations.

This makes user switching quicker during busy shifts while still allowing individual accounts and role-based access.

---

## 🌐 Self-Hosted Server Companion

The **Lunatory Server Companion** acts as the centralized synchronization endpoint for connected stores.

It is designed to support self-hosted deployments where the organization controls its own server infrastructure.

Typical deployment:

```text
                     ┌─────────────────────────┐
                     │ Lunatory Server         │
                     │ Companion               │
                     └────────────┬────────────┘
                                  │
                    Centralized synchronization
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
        ┌───────▼───────┐ ┌──────▼────────┐ ┌─────▼─────────┐
        │ Store 1       │ │ Store 2       │ │ Store 3       │
        │ Tablet / PC   │ │ Tablet / PC   │ │ Tablet / PC   │
        └───────────────┘ └───────────────┘ └───────────────┘
```

---

# 📦 Downloads

Lunatory v2.4.0 provides native packages for multiple platforms.

## Android

```text
Lunatory-Server-Companion-v2.4.0-release.apk
```

Designed for supported Android devices including store tablets and compatible barcode-scanning hardware.

---

## Linux

```text
Lunatory-Server-Companion-v2.4.0-all.deb
```

Designed for Debian-based systems including:

- Debian
- Ubuntu
- Raspberry Pi environments
- Compatible Debian-based servers

Install with:

```bash
sudo dpkg -i Lunatory-Server-Companion-v2.4.0-all.deb
```

The Linux package includes a built-in `systemd` daemon service.

---

## Windows

### Server Companion

```text
Lunatory-Server-Companion-v2.4.0-Setup.exe
```

### Workstation

```text
Lunatory-Workstation-v2.4.0-x64.exe
```

The Windows packages are intended for Windows 10/11 and compatible Windows Server environments.

---

# 🚀 Getting Started

## 1. Install the Server Companion

Choose the package for the operating system that will host your Lunatory server.

For a centralized multi-store deployment, install the Server Companion on the machine that will act as your primary Lunatory server.

## 2. Configure Your Store

Open Lunatory and configure the first store.

Store configuration may include:

- Store name
- Delivery days
- Truck schedule
- Ordering cutoff times
- Order deadlines

## 3. Create Users

Create the required user accounts and assign the appropriate role:

- **Admin**
- **General Manager**

Configure a 4-digit PIN for quick authentication on shared devices.

## 4. Connect Store Devices

Install or open Lunatory on the required store devices and connect them to the Lunatory Server Companion.

## 5. Add Additional Stores

Administrators can add and configure additional locations as needed.

---

# 🖥️ Supported Deployment Types

Lunatory can be used in several configurations.

### Single Store

```text
Server Companion
      │
      ├── Store Workstation
      └── Android Tablet
```

### Multi-Store

```text
Central Lunatory Server
      │
      ├── Store A
      ├── Store B
      └── Store C
```

### Windows Server

Run the Lunatory Server Companion using the Windows installer.

### Linux Server

Run the Server Companion as a Debian package with its included system service.

---

# 🏷️ Releases

Release builds are published through **GitHub Releases**.

Current release:

```text
v2.4.0
```

Release packages can include:

- Android APK
- Linux Debian package
- Windows Server Companion installer
- Windows Workstation installer
- `CHANGELOG.md`
- `release.json`

---

# 🛠️ Development

This repository contains the Lunatory application and deployment resources.

For development builds, clone the repository:

```bash
git clone https://github.com/deckulovescodeing/Lunatory.git
cd Lunatory
```

# 🔄 Updating

Before upgrading a production Lunatory installation:

1. Review the latest release notes.
2. Back up important application and store data.
3. Install the new platform package.
4. Confirm store configuration.
5. Confirm user roles and permissions.
6. Verify connected devices can synchronize.

---

# 📝 Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for release-specific changes.

---

# 🔒 Security

Lunatory uses role-based access and PIN authentication for store operations.

For production deployments:

- Keep the Server Companion on a trusted network.
- Limit administrative accounts.
- Do not expose management interfaces directly to the public internet without appropriate protection.
- Back up application and store data regularly.
- Keep host operating systems updated.

---

# 🤝 Contributing

Lunatory is currently under active development.

If this repository is opened for outside contributions later, contribution instructions, development setup details, coding standards, and pull request requirements can be added in a dedicated `CONTRIBUTING.md`.

---

# 📄 License

A license has not yet been specified in the provided project information.

Before publishing the repository publicly, add a `LICENSE` file and update this section with the chosen license.

---

# 🌙 Lunatory v2.4.0

**Multi-Store Logistics • Native Applications • Self-Hosted Sync**

Built to make store inventory and logistics easier to manage across shared devices, local infrastructure, and multiple locations.
