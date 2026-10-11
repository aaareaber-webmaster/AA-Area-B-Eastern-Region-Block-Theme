const { registerPlugin } = wp.plugins;
const { PluginDocumentSettingPanel } = wp.editPost;
const { CheckboxControl } = wp.components;
const { useSelect, useDispatch } = wp.data;

function AutomaticNavigationPanel() {
  const postType = useSelect(
    (select) => select("core/editor").getCurrentPostType(),
    [],
  );

  const excluded = useSelect(
    (select) =>
      select("core/editor").getEditedPostAttribute("meta")
        ?._exclude_from_auto_navigation ?? false,
    [],
  );

  const { editPost } = useDispatch("core/editor");

  if (postType !== "page") {
    return null;
  }

  return wp.element.createElement(
    PluginDocumentSettingPanel,
    {
      name: "area-b-automatic-navigation",
      title: "Automatic Navigation",
      className: "area-b-automatic-navigation",
    },
    wp.element.createElement(CheckboxControl, {
      label: "Exclude from automatic navigation",
      help: "Prevents this page from appearing in automatic Page List navigation.",
      checked: Boolean(excluded),
      onChange: (value) => {
        editPost({
          meta: {
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
