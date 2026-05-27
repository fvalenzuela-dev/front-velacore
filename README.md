# Front Velacore

Aplicación frontend de Velacore creada con Angular CLI. Este proyecto usa Angular 21, Tailwind CSS, npm como gestor de paquetes y Node.js 24 definido en `.nvmrc`.

## Requisitos

- Node.js 24, preferentemente administrado con `nvm`.
- npm 11.12.1 o compatible, definido en `package.json` como `packageManager`.
- Angular CLI disponible desde las dependencias del proyecto. No hace falta instalarlo globalmente si usás `npx ng` o los scripts de npm.

## Instalación

1. Ubicate en la carpeta del proyecto:

```bash
cd /Users/fernandovalenzuela/dev/frontend/angular/front-velacore
```

1. Cargá la versión de Node definida por el proyecto:

```bash
nvm use
```

Si todavía no tenés Node 24 instalado:

```bash
nvm install 24
nvm use
```

1. Instalá las dependencias:

```bash
npm install
```

## Ejecución en desarrollo

Para levantar el servidor local:

```bash
npm start
```

El comando ejecuta `ng serve`. Luego abrí:

```text
http://localhost:4200/
```

Angular recarga automáticamente la aplicación cuando detecta cambios en los archivos fuente.

## Compilación

### Build de producción

```bash
npm run build
```

Este comando ejecuta `ng build` con la configuración de producción por defecto y genera los artefactos en `dist/`.

### Build en modo watch

```bash
npm run watch
```

Este comando ejecuta `ng build --watch --configuration development` y recompila cuando cambian los archivos.

## Tests

Para ejecutar los tests unitarios:

```bash
npm test
```

El comando usa `ng test` con el builder de testing configurado por Angular.

## Comandos útiles de Angular CLI

Podés usar Angular CLI desde npm:

```bash
npm run ng -- generate component nombre-componente
npm run ng -- generate service nombre-servicio
npm run ng -- generate directive nombre-directiva
npm run ng -- generate pipe nombre-pipe
npm run ng -- help
```

También podés usar `npx ng` si preferís invocar directamente la CLI local:

```bash
npx ng generate component nombre-componente
```

## Estructura del proyecto

```text
.
├── angular.json          # Configuración de Angular CLI
├── package.json          # Scripts, dependencias y packageManager
├── public/               # Assets públicos servidos por Angular
├── src/
│   ├── index.html        # HTML principal
│   ├── main.ts           # Punto de entrada de la aplicación
│   ├── styles.css        # Estilos globales
│   └── app/
│       ├── app.ts        # Componente raíz
│       ├── app.html      # Template del componente raíz
│       ├── app.css       # Estilos del componente raíz
│       ├── app.config.ts # Configuración de providers de la app
│       ├── app.routes.ts # Rutas de la aplicación
│       └── app.spec.ts   # Tests del componente raíz
├── tsconfig*.json        # Configuración de TypeScript
└── .nvmrc                # Versión de Node requerida: 24
```

## Versiones y entorno

- Angular: `^21.2.x`
- Angular CLI: `^21.2.12`
- TypeScript: `~5.9.2`
- Tailwind CSS: `^4.x`, configurado con PostCSS e importado desde `src/styles.css`.
- Node.js requerido por el proyecto: `24`
- npm declarado: `11.12.1`
- Configuración estricta de TypeScript y Angular templates habilitada.
- El build de producción es la configuración por defecto de `ng build`.
- El servidor de desarrollo usa la configuración `development` por defecto.

## Verificación rápida

Después de instalar dependencias, podés verificar el entorno con:

```bash
node --version
npm --version
npm run ng -- version
npm run build
npm test
```

## Troubleshooting

### `nvm: command not found`

Si la terminal no reconoce `nvm`, probablemente no está cargado en tu shell. Verificá que tu archivo de configuración (`~/.zshrc`, `~/.bashrc` o equivalente) cargue `nvm`.

Ejemplo habitual para zsh:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

Luego reiniciá la terminal o ejecutá:

```bash
source ~/.zshrc
```

### La versión de Node no coincide

Ejecutá:

```bash
nvm install 24
nvm use
node --version
```

### Problemas con dependencias

Si hay errores raros después de cambiar de versión de Node, reinstalá dependencias:

```bash
rm -rf node_modules package-lock.json
npm install
```

### El puerto 4200 está ocupado

Levantá Angular en otro puerto:

```bash
npm start -- --port 4300
```
