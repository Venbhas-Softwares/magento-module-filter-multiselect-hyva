# Venbhas FilterMultiselect — Hyvä Compatibility Module

> Hyvä theme compatibility layer for the [Venbhas FilterMultiselect](../FilterMultiselect) module.

[![Magento 2.4.x](https://img.shields.io/badge/Magento-2.4.x-orange?logo=magento)](https://devdocs.magento.com/)
[![PHP 8.1+](https://img.shields.io/badge/PHP-8.1%20%7C%208.2%20%7C%208.3%20%7C%208.4-blue?logo=php)](https://www.php.net/)
[![License: OSL-3.0](https://img.shields.io/badge/License-OSL--3.0-blue.svg)](LICENSE)
[![Packagist](https://img.shields.io/packagist/v/venbhas/module-filter-multiselect-hyva)](https://packagist.org/packages/venbhas/module-filter-multiselect-hyva)

---

## Overview

This module provides Hyvä-compatible frontend templates and Alpine.js components for `Venbhas_FilterMultiselect`. It replaces the default Luma/Knockout templates with lightweight Tailwind CSS + Alpine.js equivalents that work with Hyvä's Content Security Policy.

---

## Requirements

| Dependency | Version |
|---|---|
| PHP | 8.1 / 8.2 / 8.3 / 8.4 |
| Magento CE/EE | 2.4.x |
| hyva-themes/magento2-theme-module | * |
| venbhas/module-filter-multiselect | * |

---

## Installation

### Via Composer (recommended)

```bash
composer require venbhas/module-filter-multiselect-hyva
bin/magento module:enable Venbhas_FilterMultiselectHyva
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean
```

### Manual Installation

1. Copy the module into `app/code/Venbhas/FilterMultiselectHyva/`.
2. Run from your Magento root:

```bash
bin/magento module:enable Venbhas_FilterMultiselectHyva
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean
```

---

## License

This module is open-source software licensed under the [Open Software License 3.0 (OSL-3.0)](LICENSE).

---

## Support

Maintained by [Venbhas Softwares](https://github.com/Venbhas-Softwares).
For bugs or feature requests, please [open an issue](https://github.com/Venbhas-Softwares/magento-module-filter-multiselect-hyva/issues).
