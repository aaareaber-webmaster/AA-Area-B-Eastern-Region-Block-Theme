const { registerPlugin } = wp.plugins;
const { PluginDocumentSettingPanel } = wp.editPost;
const { CheckboxControl } = wp.components;
const { useSelect, useDispatch } = wp.data;
const { createElement } = wp.element;
const { createHigherOrderComponent } = wp.compose;
const { addFilter } = wp.hooks;

/**
 * Page editor control for excluding a page from automatic navigation.
 */
function AutomaticNavigationPanel() {
  const postType = useSelect(
    (select) => select("core/editor").getCurrentPostType(),
    [],
  );

  const excluded = useSelect((select) => {
    const meta = select("core/editor").getEditedPostAttribute("meta");

    return Boolean(meta?._exclude_from_auto_navigation ?? false);
  }, []);

  const { editPost } = useDispatch("core/editor");

  if (postType !== "page") {
    return null;
  }

  return createElement(
    PluginDocumentSettingPanel,
    {
      name: "area-b-automatic-navigation",
      title: "Automatic Navigation",
      className: "area-b-automatic-navigation",
    },
    createElement(CheckboxControl, {
      label: "Exclude from automatic navigation",
      help: "Prevents this page from appearing in automatic Page List navigation.",
      checked: excluded,
      onChange: (value) => {
        const currentMeta =
          wp.data.select("core/editor").getEditedPostAttribute("meta") || {};

        editPost({
          meta: {
            ...currentMeta,
            _exclude_from_auto_navigation: value,
          },
        });
      },
    }),
  );
}

registerPlugin("area-b-automatic-navigation", {
  render: AutomaticNavigationPanel,
});

/**
 * Hide excluded Page List items in the editor when the Page List is
 * being used inside a Navigation block.
 *
 * This only changes the editor preview. The frontend remains controlled
 * by the PHP get_pages_query_args filter.
 */
const withAutomaticNavigationExclusions = createHigherOrderComponent(
  (BlockEdit) => {
    return function AutomaticNavigationExclusion(props) {
      if (props.name !== "core/page-list-item") {
        return createElement(BlockEdit, props);
      }

      const pageId = Number(props.attributes?.id || 0);

      const { isInsideNavigation, page } = useSelect(
        (select) => {
          const blockEditor = select("core/block-editor");

          const core = select("core");

          const parentIds = blockEditor.getBlockParents(props.clientId) || [];

          const insideNavigation = parentIds.some(
            (parentClientId) =>
              blockEditor.getBlockName(parentClientId) === "core/navigation",
          );

          return {
            isInsideNavigation: insideNavigation,

            page:
              pageId > 0
                ? core.getEntityRecord("postType", "page", pageId, {
                    context: "edit",
                  })
                : null,
          };
        },
        [props.clientId, pageId],
      );

      /*
       * Only alter Page Lists contained by Navigation.
       * Ordinary Page List blocks elsewhere remain unchanged.
       */
      if (!isInsideNavigation) {
        return createElement(BlockEdit, props);
      }

      const excluded = Boolean(page?.meta?._exclude_from_auto_navigation);

      if (excluded) {
        return null;
      }

      return createElement(BlockEdit, props);
    };
  },
  "withAutomaticNavigationExclusions",
);

addFilter(
  "editor.BlockEdit",
  "area-b/automatic-navigation-exclusions",
  withAutomaticNavigationExclusions,
);
