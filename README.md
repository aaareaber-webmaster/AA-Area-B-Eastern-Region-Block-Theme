# AA Area B Eastern Region Block Theme

Custom WordPress block theme for the Alcoholics Anonymous Area B Eastern Region website [aaareaber.org.au](https://aaareaber.org.au).

## Requirements

- WordPress 6.7 or later
- PHP 8.1 or later

## Features

- Full Site Editing and native Gutenberg blocks
- Responsive primary and mobile overlay navigation
- Automatically generated navigation using the Page List block
- Page-level navigation exclusions
- Custom hero carousel block
- Custom block patterns and templates
- Responsive layouts
- Accessibility-focused styling and markup
- Reduced-motion support

## Navigation

Primary and overlay navigation use a native `core/page-list` block inside `core/navigation`.

WordPress currently renders this combination with an invalid nested `<ul>` structure. A targeted `render_block_core/navigation` filter in `functions.php` removes the redundant Page List wrapper for:

- `area-primary-navigation`
- `area-overlay-navigation`

This preserves automatic Page List navigation while producing valid list markup.

Pages can be excluded from automatic navigation using the navigation setting provided in the page editor.

## Development

Theme files are located in:

- `assets/` – scripts and other theme assets
- `blocks/` – custom blocks
- `parts/` – template parts
- `patterns/` – block patterns
- `templates/` – block templates
- `functions.php` – theme functionality and WordPress hooks
- `style.css` – global and component styling
- `theme.json` – global styles and theme configuration

## Accessibility

The theme includes accessible focus states, colour contrast, minimum interactive target sizes, semantic navigation markup and reduced-motion handling.

## License

GNU GPL 3.0 - Developed for Alcoholics Anonymous Area B Eastern Region.