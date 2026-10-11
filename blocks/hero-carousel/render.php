<?php
/**
 * Render the Area B Hero Carousel block.
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Rendered InnerBlocks.
 * @var WP_Block $block      Block instance.
 */

if (!defined('ABSPATH')) {
	exit;
}

$aria_label = isset($attributes['ariaLabel'])
	? trim((string) $attributes['ariaLabel'])
	: '';

if ('' === $aria_label) {
	$aria_label = __('Featured content', 'area-b');
}

$interval = isset($attributes['interval'])
	? max(2, (float) $attributes['interval'])
	: 7.5;

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class' => 'area-b-carousel',
		'role' => 'region',
		'aria-roledescription' => 'carousel',
		'aria-label' => $aria_label,
		'data-autoplay' => !empty($attributes['autoplay']) ? 'true' : 'false',
		'data-interval' => (string) round($interval * 1000),
		'data-loop' => !empty($attributes['loop']) ? 'true' : 'false',
		'data-pause-hover' => !empty($attributes['pauseOnHover']) ? 'true' : 'false',
		'data-show-arrows' => !empty($attributes['showArrows']) ? 'true' : 'false',
		'data-show-dots' => !empty($attributes['showDots']) ? 'true' : 'false',
	]
);
?>

<div <?php echo $wrapper_attributes; ?>>
	<?php echo $content; ?>
</div>