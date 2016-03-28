# ub-layout

ub_layout is a javascript function that attempts to layout html elements withing the viewport.

Managed elements have the attribute 'scrollable' and the default size of the element is from the current top left position (rtl not yet supported) to the bottom right of the screen - with some caveats.

Tables are turned into scrollable tables. ub_layout goes to a lot of trouble to not change the natural width of the table, unless asked to.

ub_layout also includes features for table row collapse/reveal and sideways scrolling of the viewport.
