@echo off
echo Creating project structure...

REM Create frontend structure
mkdir frontend\public
mkdir frontend\src
mkdir frontend\src\api
mkdir frontend\src\components
mkdir frontend\src\components\common
mkdir frontend\src\components\layout
mkdir frontend\src\components\images
mkdir frontend\src\components\tags
mkdir frontend\src\components\processing
mkdir frontend\src\pages
mkdir frontend\src\pages\auth
mkdir frontend\src\pages\dashboard
mkdir frontend\src\pages\images
mkdir frontend\src\pages\crawler
mkdir frontend\src\pages\processing
mkdir frontend\src\pages\tags
mkdir frontend\src\pages\settings
mkdir frontend\src\utils
mkdir frontend\src\styles
mkdir frontend\src\context

REM Create backend structure
mkdir backend
mkdir backend\src
mkdir backend\src\api
mkdir backend\src\controllers
mkdir backend\src\models
mkdir backend\src\services
mkdir backend\src\utils
mkdir backend\src\middlewares
mkdir backend\src\config
mkdir backend\src\crawlers
mkdir backend\src\processors
mkdir backend\src\ai
mkdir backend\src\db
mkdir backend\src\db\migrations
mkdir backend\src\db\seeders
mkdir backend\tests
mkdir backend\scripts
mkdir backend\logs
mkdir backend\uploads

REM Create docs structure
mkdir docs
mkdir docs\api
mkdir docs\database
mkdir docs\deployment
mkdir docs\user-guide

REM Create scripts directory
mkdir scripts

echo Project structure created successfully!