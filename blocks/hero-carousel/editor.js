(function (blocks, element, blockEditor, components, i18n, data) {
  "use strict";

  const el = element.createElement;
  const Fragment = element.Fragment;

  const registerBlockType = blocks.registerBlockType;

  const { InnerBlocks, InspectorControls, useBlockProps, useInnerBlocksProps } =
    blockEditor;

  const { PanelBody, RangeControl, TextControl, ToggleControl } = components;

  const { __ } = i18n;

  const TEMPLATE = [["core/cover"]];

  registerBlockType("area-b/hero-carousel", {
    apiVersion: 3,

    title: __("Area B Hero Carousel", "area-b"),
    category: "design",
    icon: "images-alt2",

    attributes: {
      align: {
        type: "string",
        default: "full",
      },
      autoplay: {
        type: "boolean",
        default: true,
      },
      interval: {
        type: "number",
        default: 7.5,
      },
      loop: {
        type: "boolean",
        default: true,
      },
      pauseOnHover: {
        type: "boolean",
        default: true,
      },
      showArrows: {
        type: "boolean",
        default: true,
      },
      showDots: {
        type: "boolean",
        default: true,
      },
      ariaLabel: {
        type: "string",
        default: "Featured content",
      },
    },

    supports: {
      align: ["wide", "full"],
      html: false,
    },

    edit: function (props) {
      const attributes = props.attributes;
      const setAttributes = props.setAttributes;

      const blockProps = useBlockProps({
        className: "area-b-carousel area-b-carousel--editor",
      });

      const [activeId, setActiveId] = element.useState(null);
      const state = data.useSelect(
        function (select) {
          const store = select("core/block-editor");
          const ids = store.getBlockOrder(props.clientId);
          const selected = store.getSelectedBlockClientId();
          const parents = selected ? store.getBlockParents(selected) : [];
          return {
            ids: ids,
            selectedSlide: ids.find(function (id) {
              return id === selected || parents.indexOf(id) !== -1;
            }),
            canAdd: store.canInsertBlockType("core/cover", props.clientId),
          };
        },
        [props.clientId],
      );
      const actions = data.useDispatch("core/block-editor");
      const ids = state.ids;
      const visibleId =
        state.selectedSlide ||
        (ids.indexOf(activeId) !== -1 ? activeId : ids[0]);
      const current = ids.indexOf(visibleId);
      element.useEffect(
        function () {
          if (visibleId && visibleId !== activeId) setActiveId(visibleId);
        },
        [visibleId, activeId],
      );
      function showSlide(index) {
        if (ids[index]) {
          setActiveId(ids[index]);
          actions.selectBlock(ids[index]);
        }
      }
      function addSlide() {
        actions.insertBlock(
          blocks.createBlock("core/cover"),
          ids.length,
          props.clientId,
        );
      }
      // Cover resize controls are portalled into the outer editor document.
      // Remove this rule immediately when selection leaves this carousel.
      element.useEffect(function () {
        if (!state.selectedSlide) return;
        const style = document.createElement('style');
        style.setAttribute('data-area-b-carousel-resize-style', props.clientId);
        style.textContent = '.block-library-cover__resizable-box-popover { display: none !important; }';
        document.head.appendChild(style);
        return function () { style.remove(); };
      }, [state.selectedSlide, props.clientId]);

      const trackId = "area-b-carousel-editor-" + props.clientId;
      const innerBlocksProps = useInnerBlocksProps(
        {
          id: trackId,
          className: "area-b-carousel__editor-track",
        },
        {
          allowedBlocks: ["core/cover"],
          template: TEMPLATE,
          templateLock: false,
          orientation: "horizontal",
          renderAppender: false,
        },
      );
      // Hide only direct slide wrappers; nested blocks remain editable.
      const slideStyle = visibleId
        ? "#" +
          trackId +
          ' > [data-block]:not([data-block="' +
          visibleId +
          '"]) { display: none !important; }'
        : "";

      return el(
        Fragment,
        null,

        el(
          InspectorControls,
          null,

          el(
            PanelBody,
            {
              title: __("Carousel settings", "area-b"),
              initialOpen: true,
            },

            el(ToggleControl, {
              label: __("Autoplay", "area-b"),
              checked: attributes.autoplay,
              onChange: function (value) {
                setAttributes({ autoplay: value });
              },
            }),

            attributes.autoplay &&
              el(RangeControl, {
                label: __("Autoplay interval", "area-b"),
                help: attributes.interval + " seconds between slides",
                value: attributes.interval,
                min: 2,
                max: 20,
                step: 0.5,
                onChange: function (value) {
                  setAttributes({ interval: value });
                },
              }),

            el(ToggleControl, {
              label: __("Pause on hover", "area-b"),
              checked: attributes.pauseOnHover,
              onChange: function (value) {
                setAttributes({ pauseOnHover: value });
              },
            }),

            el(ToggleControl, {
              label: __("Loop continuously", "area-b"),
              checked: attributes.loop,
              onChange: function (value) {
                setAttributes({ loop: value });
              },
            }),

            el(ToggleControl, {
              label: __("Show arrows", "area-b"),
              checked: attributes.showArrows,
              onChange: function (value) {
                setAttributes({ showArrows: value });
              },
            }),

            el(ToggleControl, {
              label: __("Show navigation dots", "area-b"),
              checked: attributes.showDots,
              onChange: function (value) {
                setAttributes({ showDots: value });
              },
            }),

            el(TextControl, {
              label: __("Accessible label", "area-b"),
              value: attributes.ariaLabel,
              onChange: function (value) {
                setAttributes({ ariaLabel: value });
              },
            }),
          ),
        ),

        el(
          "div",
          blockProps,

          el("style", null, slideStyle),
          el(
            "div",
            { className: "area-b-carousel__editor-viewport" },
            el("div", innerBlocksProps),
            ids.length > 1 &&
              attributes.showArrows &&
              el(
                "button",
                {
                  type: "button",
                  className:
                    "area-b-carousel__arrow area-b-carousel__arrow--previous",
                  "aria-label": __("Previous slide", "area-b"),
                  disabled: !attributes.loop && current === 0,
                  onClick: function () {
                    showSlide((current - 1 + ids.length) % ids.length);
                  },
                },
                "‹",
              ),
            ids.length > 1 &&
              attributes.showArrows &&
              el(
                "button",
                {
                  type: "button",
                  className:
                    "area-b-carousel__arrow area-b-carousel__arrow--next",
                  "aria-label": __("Next slide", "area-b"),
                  disabled: !attributes.loop && current === ids.length - 1,
                  onClick: function () {
                    showSlide((current + 1) % ids.length);
                  },
                },
                "›",
              ),
            ids.length > 1 &&
              attributes.showDots &&
              el(
                "div",
                { className: "area-b-carousel__pagination" },
                ids.map(function (id, index) {
                  return el("button", {
                    key: id,
                    type: "button",
                    className: "area-b-carousel__dot",
                    "aria-label":
                      __("Show slide", "area-b") + " " + (index + 1),
                    "aria-current": id === visibleId ? "true" : undefined,
                    onClick: function () {
                      showSlide(index);
                    },
                  });
                }),
              ),
          ),
          el(
            "div",
            { className: "area-b-carousel__editor-controls" },
            el(
              "span",
              { "aria-live": "polite" },
              ids.length
                ? __("Slide", "area-b") +
                    " " +
                    (current + 1) +
                    " / " +
                    ids.length
                : __("No slides yet", "area-b"),
            ),
            ids.map(function (id, index) {
              return el(
                components.Button,
                {
                  key: id,
                  variant: id === visibleId ? "primary" : "secondary",
                  "aria-label": __("Edit slide", "area-b") + " " + (index + 1),
                  "aria-pressed": id === visibleId,
                  onClick: function () {
                    showSlide(index);
                  },
                },
                String(index + 1),
              );
            }),
            state.canAdd &&
              el(
                components.Button,
                {
                  variant: "secondary",
                  onClick: addSlide,
                },
                __("Add slide", "area-b"),
              ),
          ),
        ),
      );
    },

    save: function () {
      return el(InnerBlocks.Content);
    },
  });
})(
  window.wp.blocks,
  window.wp.element,
  window.wp.blockEditor,
  window.wp.components,
  window.wp.i18n,
  window.wp.data,
);
