<?php
/**
 * AA Area B Eastern Region block theme functions.
 *
 * @package AA_Area_B_Block_Theme
 */

if (!defined('ABSPATH')) {
	exit;
}

function aaareaber_block_asset_version(string $relative_path): string
{
	$asset_path = get_stylesheet_directory() . $relative_path;

	return file_exists($asset_path) ? (string) filemtime($asset_path) : wp_get_theme()->get('Version');
}

function aaareaber_block_theme_setup(): void
{
	add_theme_support('wp-block-styles');
	add_theme_support('responsive-embeds');
	add_theme_support('editor-styles');
	add_theme_support('title-tag');
	add_theme_support(
		'html5',
		array(
			'caption',
			'comment-form',
			'comment-list',
			'gallery',
			'navigation-widgets',
			'search-form',
			'style',
			'script',
		)
	);
	add_theme_support(
		'custom-logo',
		array(
			'height' => 120,
			'width' => 360,
			'flex-height' => true,
			'flex-width' => true,
		)
	);

	register_nav_menus(
		array(
			'primary' => __('Primary Navigation', 'aa-area-b'),
			'footer_primary' => __('Footer Primary Links', 'aa-area-b'),
			'footer_secondary' => __('Footer Secondary Links', 'aa-area-b'),
			'footer_tertiary' => __('Footer Tertiary Links', 'aa-area-b'),
			'footer_legal' => __('Footer Legal Links', 'aa-area-b'),
		)
	);
}
add_action('after_setup_theme', 'aaareaber_block_theme_setup');

function aaareaber_block_enqueue_assets(): void
{
	wp_enqueue_style(
		'aaareaber-local-fonts',
		get_stylesheet_directory_uri() . '/assets/css/fonts.css',
		array(),
		aaareaber_block_asset_version('/assets/css/fonts.css')
	);

	wp_enqueue_style(
		'aaareaber-block-theme',
		get_stylesheet_uri(),
		array('aaareaber-local-fonts'),
		aaareaber_block_asset_version('/style.css')
	);
}
add_action('wp_enqueue_scripts', 'aaareaber_block_enqueue_assets');
add_action('enqueue_block_editor_assets', 'aaareaber_block_enqueue_assets');

/**
 * Automatic navigation exclusions.
 *
 * Adds an "Exclude from automatic navigation" option to Pages and
 * removes excluded pages from WordPress's native core/page-list block.
 */

/**
 * Register the page meta.
 */
function area_b_register_navigation_meta()
{
	register_post_meta(
		'page',
		'_exclude_from_auto_navigation',
		array(
			'type' => 'boolean',
			'single' => true,
			'default' => false,
			'show_in_rest' => true,
			'sanitize_callback' => 'rest_sanitize_boolean',
			'auth_callback' => function () {
				return current_user_can('edit_pages');
			},
		)
	);
}
add_action('init', 'area_b_register_navigation_meta');

/**
 * Exclude marked pages from the native Page List block.
 *
 * core/page-list currently calls get_pages() using:
 *
 *     sort_column => menu_order,post_title
 *     order       => asc
 *
 * We target that query rather than changing Page queries globally.
 */
function area_b_filter_automatic_navigation_pages($query_args, $parsed_args)
{

	// Only target the query shape used by the native Page List block.
	if (
		'page' !== ($parsed_args['post_type'] ?? 'page') ||
		'menu_order,post_title' !== ($parsed_args['sort_column'] ?? '') ||
		'asc' !== strtolower($parsed_args['sort_order'] ?? '')
	) {
		return $query_args;
	}

	$excluded_pages = get_posts(
		array(
			'post_type' => 'page',
			'post_status' => 'publish',
			'posts_per_page' => -1,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => '_exclude_from_auto_navigation',
					'value' => '1',
					'compare' => '=',
				),
			),
		)
	);

	if (!empty($excluded_pages)) {
		$query_args['post__not_in'] = array_unique(
			array_merge(
				$query_args['post__not_in'] ?? array(),
				$excluded_pages
			)
		);
	}

	return $query_args;
}
add_filter(
	'get_pages_query_args',
	'area_b_filter_automatic_navigation_pages',
	10,
	2
);

/**
 * Fix invalid list markup generated when a Page List block is used
 * directly inside the automatic Navigation block.
 *
 * WordPress normally renders:
 *
 * <ul class="wp-block-navigation__container">
 *     <ul class="wp-block-page-list">
 *         <li>...</li>
 *     </ul>
 * </ul>
 *
 * This removes only the redundant Page List <ul>, leaving its <li>
 * elements as direct children of the Navigation <ul>.
 */
function area_b_fix_page_list_navigation_markup( $block_content, $block ) {

	// Only target this theme's automatic navigation.
	$class_name = $block['attrs']['className'] ?? '';

	if (
		! str_contains( $class_name, 'area-overlay-navigation' ) &&
		! str_contains( $class_name, 'area-primary-navigation' )
	) {
		return $block_content;
	}

	// Make sure the Navigation directly contains a Page List block.
	$has_page_list = false;

	foreach ( $block['innerBlocks'] ?? array() as $inner_block ) {
		if ( 'core/page-list' === ( $inner_block['blockName'] ?? '' ) ) {
			$has_page_list = true;
			break;
		}
	}

	if ( ! $has_page_list ) {
		return $block_content;
	}

	/*
	 * Remove the opening wp-block-page-list <ul>.
	 */
	$block_content = preg_replace(
		'/<ul\b[^>]*class="[^"]*\bwp-block-page-list\b[^"]*"[^>]*>/',
		'',
		$block_content,
		1
	);

	/*
	 * Remove the corresponding closing </ul>.
	 *
	 * At this point the Page List wrapper is the last list closed before
	 * the Navigation container itself closes.
	 */
	$block_content = preg_replace(
		'/<\/ul>(\s*)<\/ul>(\s*<\/div>)/',
		'$1</ul>$2',
		$block_content,
		1
	);

	return $block_content;
}

add_filter(
	'render_block_core/navigation',
	'area_b_fix_page_list_navigation_markup',
	10,
	2
);

function area_b_enqueue_navigation_meta_editor_script()
{
	$script_path = get_stylesheet_directory() . '/assets/js/editor-navigation-meta.js';

	if (!file_exists($script_path)) {
		return;
	}

	wp_enqueue_script(
		'area-b-navigation-meta-editor',
		get_stylesheet_directory_uri() . '/assets/editor-navigation-meta.js',
		array(
			'wp-plugins',
			'wp-edit-post',
			'wp-element',
			'wp-components',
			'wp-data',
			'wp-compose',
			'wp-hooks',
			'wp-core-data',
			'wp-block-editor',
		),
		filemtime($script_path),
		true
	);
}
add_action('enqueue_block_editor_assets', 'area_b_enqueue_navigation_meta_editor_script');

/**
 * Register the Area B Hero Carousel block.
 */
function area_b_register_hero_carousel_block(): void
{
	$block_dir = get_stylesheet_directory() . '/blocks/hero-carousel';
	$block_uri = get_stylesheet_directory_uri() . '/blocks/hero-carousel';

	wp_register_script(
		'area-b-hero-carousel-editor',
		$block_uri . '/editor.js',
		[
			'wp-blocks',
			'wp-element',
			'wp-block-editor',
			'wp-components',
			'wp-i18n',
		],
		filemtime($block_dir . '/editor.js'),
		true
	);

	wp_register_script(
		'area-b-hero-carousel-view',
		$block_uri . '/view.js',
		[],
		filemtime($block_dir . '/view.js'),
		true
	);

	wp_register_style(
		'area-b-hero-carousel-style',
		$block_uri . '/style.css',
		[],
		filemtime($block_dir . '/style.css')
	);

	wp_register_style(
		'area-b-hero-carousel-editor-style',
		$block_uri . '/editor.css',
		['wp-edit-blocks'],
		filemtime($block_dir . '/editor.css')
	);

	register_block_type($block_dir);
}
add_action('init', 'area_b_register_hero_carousel_block');

function aaareaber_block_login_assets(): void
{
	$login_css = '/assets/css/login.css';

	if (file_exists(get_stylesheet_directory() . $login_css)) {
		wp_enqueue_style(
			'aaareaber-login',
			get_stylesheet_directory_uri() . $login_css,
			array(),
			aaareaber_block_asset_version($login_css)
		);
	}
}
add_action('login_enqueue_scripts', 'aaareaber_block_login_assets');

add_filter(
	'login_headerurl',
	static function (): string {
		return home_url('/');
	}
);

add_filter(
	'login_headertext',
	static function (): string {
		return 'Alcoholics Anonymous Australia - AA Area B Eastern Region Australia';
	}
);

add_filter(
	'admin_footer_text',
	static function (): string {
		return '<p id="footer-left" class="alignleft"><span id="footer-thankyou">Thank you for your service. :)</span></p>';
	}
);

add_filter(
	'the_excerpt',
	static function (string $excerpt): string {
		return post_password_required() ? '' : $excerpt;
	}
);

add_filter(
	'site_status_tests',
	static function (array $tests): array {
		unset($tests['direct']['persistent_object_cache']);

		return $tests;
	}
);

add_filter(
	'upload_mimes',
	static function (array $mimes): array {
		$mimes['svg'] = 'image/svg+xml';

		return $mimes;
	}
);

add_filter(
	'render_block_core/paragraph',
	static function (string $block_content): string {
		if (false !== strpos($block_content, '{{aaareaber_current_year}}')) {
			$block_content = str_replace('{{aaareaber_current_year}}', esc_html(wp_date('Y')), $block_content);
		}

		return $block_content;
	}
);

/**
 * Keep the custom overlay's click submenus independent of its open state.
 * Core's isSubmenuOpen otherwise inherits overlayOpenedBy and forces them open.
 * The outer overlay retains its own context, focus trap and close controls.
 */
add_filter(
	'render_block_core/navigation',
	static function (string $block_content, array $block): string {
		$classes = preg_split('/\s+/', $block['attrs']['className'] ?? '');
		if (!in_array('area-overlay-navigation', $classes, true)) {
			return $block_content;
		}

		$tags = new WP_HTML_Tag_Processor($block_content);
		if ($tags->next_tag(array('class_name' => 'area-overlay-navigation'))) {
			$context = json_decode($tags->get_attribute('data-wp-context') ?? '{}', true);
			if (!is_array($context)) {
				$context = array();
			}
			$context['overlayOpenedBy'] = array(
				'click' => false,
				'hover' => false,
				'focus' => false,
			);
			$tags->set_attribute('data-wp-context', wp_json_encode($context));
		}

		return $tags->get_updated_html();
	},
	10,
	2
);


/** Custom panel controls own submenu state; core still manages the overlay. */
add_filter('render_block_core/navigation', static function ($html, $block) {
	if (!in_array('area-overlay-navigation', preg_split('/\s+/', $block['attrs']['className'] ?? ''), true))
		return $html;
	$tags = new WP_HTML_Tag_Processor($html);
	while ($tags->next_tag()) {
		if ($tags->has_class('wp-block-navigation-submenu__toggle')) {
			$tags->remove_attribute('data-wp-on--click');
			$tags->remove_attribute('data-wp-bind--aria-expanded');
		}
		if ($tags->has_class('has-child')) {
			foreach (array('data-wp-on--keydown', 'data-wp-on--focusout', 'data-wp-watch') as $attribute)
				$tags->remove_attribute($attribute);
		}
		if ($tags->has_class('wp-block-navigation__submenu-container'))
			$tags->remove_attribute('data-wp-on--focus');
	}
	return $tags->get_updated_html();
}, 20, 2);

add_action('wp_enqueue_scripts', static function () {
	wp_enqueue_script('area-navigation-slides', get_stylesheet_directory_uri() . '/assets/js/navigation-slides.js', array(), filemtime(get_stylesheet_directory() . '/assets/js/navigation-slides.js'), true);
});
