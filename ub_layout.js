// ub_layout.js - Fluid page layout with scrolling tables and regions
//
// Copyright 2005-2013 - Zenucom Pty Ltd
//
// FUNCTIONS (functions not mentioned are internal to script - usually indicated by name prefix of "_")
//
//////////////////////
// Initialisation
//
// init()			First call that does all initialisation stuff. This is the only function that needs to called
//
//////////////////////
//
// Scrolling functions for tables, divs, and frames
// These functions are not called directly and are called on every window resize event
// In all cases these implement 2 additional attributes for div, frame, and table: ubScrollHeight and ubScrollWidth
//
// ubScrollHeight and ubScrollWidth are calculated as a percentage of the viewport from the top left corner of the object
// tables are split into 3 tables with surrounding divs - tbody div is scrollable and all of them inside a single surrounding div that represents the table
//
//////////////////////
//
// domFix()			call domWalk on event
// domWalk(node)		traverse the dom tree fixing height and width of nodes
// nodeFixHeight()		fix the height of scrollable divs
//
//////////////////////

var ub_layout = (function () {

var HorizontalScroll = false;		// true if there is a horizontal scroll bar
var loadPrevious;			// previous window.load function
var ReservedHeight = 0;			// reserved pixels at the bottom of the screen
var ReservedWidth = 0;			// reserved pixels on the right hand side of the screen
var timeOut = null;			// make sure we don't refresh screen too often
var ubScrollBarWidth = 0;		// detected scrollbar width
var winHeight = 0;			// available viewport height
var winWidth = 0;			// available viewport width

// object scroll height and width fixing

var domFix = function() {
	getViewportSize();
	if (winWidth <= 1 || winHeight <= 1) return;

	resizeScrollableTables();
	for (var child = 0; child < document.body.children.length; ++child) domShrink(document.body.children[child]);
	for (var child = 0; child < document.body.children.length; ++child) domWalk(document.body.children[child]);
	};

var domShrink = function(node) {
	var scrollTable = node.classList.contains('scrollTable');
	var tagName = node.tagName;

	if (node.hasAttribute('scrollable') || node.classList.contains('scrollable') || scrollTable) {
		if (tagName != 'TABLE' && !scrollTable) {
			if (!node.hasAttribute('ubScrollHeight')) node.setAttribute('ubScrollHeight', '100');
			// IFRAME won't set width to content so set default ubScrollWidth to 100
			if (tagName == 'IFRAME' && !node.hasAttribute('ubScrollWidth')) node.setAttribute('ubScrollWidth', '100');
			}
		if (node.hasAttribute('ubScrollHeight')) {node.ub_css({height: '0px'}); }
		if (node.hasAttribute('ubScrollWidth') && parseInt(node.getAttribute('ubScrollWidth')) != 0) node.ub_css({width: '0px'});
		}
	if (tagName != 'SCRIPT') for (var child = 0; child < node.children.length; ++child) domShrink(node.children[child]);
	};

var domWalk = function(node) {
	if (node.hasAttribute('scrollable') || node.classList.contains('scrollable') || node.classList.contains('scrollTable'))
		nodeFixHeight(node);
	if (node.tagName != 'SCRIPT') for (var child = 0; child < node.children.length; ++child) domWalk(node.children[child]);
	};

// getViewportSize - Get the available size in pixels of the viewport

var getViewportSize = function() {
	winWidth = window.innerWidth - ReservedWidth;
	winHeight = window.innerHeight - ReservedHeight - 1 - (HorizontalScroll ? ubScrollBarWidth : 0);
	};

// init - initialisation

var init = function () {
	if (ub_layout.loadPrevious) ub_layout.loadPrevious();
	window.addEventListener('resize',ub_layout.resize,false);
	Element.prototype.ub_css = layoutCss;
	Element.prototype.remove = function() {this.parentElement.removeChild(this);}
	getViewportSize();
	scrollbarWidth();
	tableInit ();
	};

// reserve - reserve some of the real estate (for message bar etc)

var reserve = function (reservedHeight, reservedWidth) {
	if (reservedHeight) {ReservedHeight = reservedHeight}
	if (reservedWidth) {ReservedWidth = reservedWidth}
	}

// Limit resize events

var resize = function(){
	if(timeOut != null) clearTimeout(timeOut);
	timeOut = setTimeout(ub_layout.domFix, 300);
	};

// nodeFixHeight - set height of node to a percentage of remaining viewport height

var nodeFixHeight = function(domNode) {
	var height = 0;
	var width = 0;
	var offset = $(domNode).offset();
	var scrollable = domNode.hasAttribute("scrollable") || domNode.classList.contains("scrollable");
	var scrollTable = domNode.classList.contains('scrollTable');

	if (domNode.getAttribute('ubScrollHeight') !== null) height = parseInt(domNode.getAttribute('ubScrollHeight'));
	if (domNode.getAttribute('ubScrollWidth') !== null) width = parseInt(domNode.getAttribute('ubScrollWidth'));

	/* this is simple as all we have to do is put up a scroll bar and calculate the height as a percentage of the available height */
	if (height) {
		if (scrollable) {
			var scrollableValue = domNode.getAttribute('scrollable');
			if (scrollableValue === null || scrollableValue === '') {
				domNode.ub_css({overflowY: 'auto'});
			} else {
				domNode.ub_css({overflowX: 'auto', overflowY: 'hidden', display: 'flex', flexDirection: 'row', flexWrap: 'nowrap'});
				}
			}

		var offsetTop = Math.ceil(offset.top);
		var newHeight = Math.floor((winHeight - offsetTop) * height / 100) + (HorizontalScroll ? ubScrollBarWidth : 0);
		newHeight -= Math.ceil($(domNode).outerHeight(true)) - 1;

		if (newHeight < 0) newHeight = 0;
		domNode.ub_css({height: newHeight+'px'});

		// if the node has class 'scrollTable' then we have to set the height of the child 'tbody' node
		if (scrollTable) {
			// fix a couple of css attributes
			var tableParts = domNode.querySelectorAll('table');
			for (var p = 0; p < tableParts.length; ++p) tableParts[p].ub_css({margin: '0px', top: '0px', left: '0px'});

			// set the height of the thead and tfoot divs to the height of the internal table
			var tbodyHeight = newHeight - (HorizontalScroll ? ubScrollBarWidth : 0);
			var tableNode;
			if (tableNode = domNode.querySelector('[name="thead"]')) tbodyHeight -= tableNode.clientHeight;
			if (tableNode = domNode.querySelector('[name="tfoot"]')) tbodyHeight -= tableNode.clientHeight;

			// now set tbody height if table height > tbodyHeight
			--tbodyHeight;
			if (tbodyHeight < 0) tbodyHeight = 0;

			var currentHeight = domNode.querySelector('[name = "tbody"] table').clientHeight;
			if (currentHeight < tbodyHeight) tbodyHeight = currentHeight;
			domNode.querySelector('[name = "tbody"]').ub_css({height: tbodyHeight+'px'});
			}
		}

	// ubScrollWidth
	if (width) {
		if (scrollTable) {
			var table = document.querySelector('[scrollTable="'+domNode.getAttribute('scrollDiv')+'"]');
			var divWidth = parseInt(table.getAttribute('_ubWidth')) + ubScrollBarWidth;

			// Hide table and display div
			domNode.ub_css({overflowX: 'auto', width: divWidth+'px'});
		} else {
			var newWidth = Math.floor((winWidth - offset.left) * width / 100);
			newWidth -= Math.ceil($(domNode).outerWidth(true));
			domNode.ub_css({width: newWidth+'px'});
			}
		}

	if (domNode.clientWidth > winWidth) domNode.ub_css({width: winWidth+'px'});
	};

// tableCollapse - Search all the tables for any that have attribute collapseLevel defined on a table row
//			If found, put an extra column at the start of every row in the table

var tableCollapse = function() {

	for (var collapseTables = document.querySelectorAll('table'), t = 0; t < collapseTables.length; ++t) {
		if (collapseTables[t].querySelectorAll(':scope > tbody > tr[collapseLevel]').length) {
			for (var collapseRows = collapseTables[t].querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr'), r = 0; r < collapseRows.length; ++r) {
				var row = collapseRows[r];
				var cell = row.children[0];
				if (!cell.getAttribute('collapseCell')) {
					var newTD = document.createElement('td');

					newTD.setAttribute('collapseCell', 'yes');
					newTD.ub_css({maxWidth: '1em', width: '1em'});
					if (row.getAttribute('collapseLevel')) {
						newTD.classList.add('collapse');
						newTD.addEventListener('click', ub_layout.trCollapse, false);
						newTD.style.cursor = 'pointer';

						/* Add attribute 'collapseState' and give default value 'open'. Other value is 'hide' */
						if (!row.getAttribute('collapseState')) { row.setAttribute ('collapseState', 'open'); }
						/* Add attribute 'collapseDirection' and give default value 'after'. Other value is 'before'. */
						if (!row.getAttribute('collapseDirection')) { row.setAttribute ('collapseDirection', 'after'); }
						if (row.getAttribute('collapseState') == 'open') {
							newTD.appendChild(document.createTextNode("-"));
						} else {
							newTD.appendChild(document.createTextNode("+"));
							}
						}
					collapseRows[r].insertBefore(newTD, collapseRows[r].firstChild);
					}
				}
			}
		}
	};

// tableInit - initialise tables and fix layout

var tableInit = function () {
	tableReverse();
	removeEmptyRows();
	tableCollapse();
	for (var collapse = document.querySelectorAll('tr[collapseState="hide"]'), t = 0; t < collapse.length; ++t) trHide (collapse[t]);
	wrapScrollableTables();
	makeCollapsibleLists();
	domFix ();
	};

// tableReverse - reverse the order of rows in table with attribute ubReverse

var tableReverse = function () {
	$('table[ubReverse]').each(function() {
		var tbody = $('tbody', $(this));

		// copy all the rows into an array
		// empty tbody
		// put the rows back in reverse order

		var tbodyRows = $('tr', $(tbody));
		$(tbody).empty();
		$(tbodyRows).each(function() {
			$(tbody).prepend($(this));
			});
		});
	};

// trCollapse - turn tr collapse on or off - this is a flip-flop

var trCollapse = function(e) {
	var tr = e.target.parentNode;
	if (tr.getAttribute('collapseState') == 'open') {
		trHide(tr);
		tr.setAttribute('collapseState', 'hide');
		tr.firstChild.innerHTML = "+";
	} else {
		trShow(tr);
		tr.setAttribute('collapseState', 'open');
		tr.firstChild.innerHTML = "-";
		}

	domFix();
	};

// trHide - hide a row

var trHide = function(tr) {
	var direction = tr.getAttribute('collapseDirection');

	// walk siblings while collapseLevel >= current level or collapseLevel is missing
	var done = false;
	var level = parseInt(tr.getAttribute('collapseLevel'));

	while ((tr = (direction == 'after' ? tr.nextSibling : tr.previousSibling)) && !done) {
		if (tr.nodeType == 1) {
			var newLevel = level + 1;	// in case collapseLevel is missing
			var levelAttribute = tr.getAttribute('collapseLevel');
			if (levelAttribute) { newLevel = parseInt(levelAttribute); }
			if (newLevel > level) { tr.style.display = 'none'; } else { done = true; }
			}
		}
	};

// trShow - show a row

var trShow = function(tr) {
	var direction = tr.getAttribute('collapseDirection');

	// walk siblings while collapseLevel >= current level or collapseLevel is missing
	var level = parseInt(tr.getAttribute('collapseLevel'));
	var done = false;

	var data_cgi;
	if ((data_cgi = tr.getAttribute('collapseCGI'))) {
		var insertNode = tr;
		while (insertNode.nodeName == 'TR' || insertNode.id == '') { insertNode = insertNode.parentNode; }
		tableCGI(insertNode.id, tr.rowIndex - 1, data_cgi);
		tr.removeAttribute('collapseCGI');
		}

	if (tr) trShowChildren(tr);

	while ((tr = (direction == 'after' ? tr.nextSibling : tr.previousSibling)) && !done) {
		if (tr.nodeType == 1) {
			var levelAttribute = tr.getAttribute('collapseLevel');
			if (levelAttribute) {
				newLevel = parseInt(levelAttribute);
				if (newLevel <= level) {
					done = true;
				} else if (newLevel == level + 1) {
					tr.style.display = 'table-row';
					if (tr.getAttribute('collapseState') == 'open') { trShow(tr); }
					}
			} else {
				tr.style.display = 'table-row';
				}
			}
		}
	};

// trShowChildren - Show row siblings that don't have a collapse level

var trShowChildren = function(tr) {
	var done = false;
	while (!done && (tr = tr.nextSibling)) {
		if (tr.nodeType == 1 && !tr.getAttribute('collapseLevel')) { tr.style.display = 'table-row'; } else { done = true; }
		tr = tr.nextSibling;
		}
	};

// scrollbarWidth - calculate width of scrollbar

var scrollbarWidth = function() {
	if (ubScrollBarWidth != 0) return;

	var $inner = $('<div style="width: 100%; height:200px;">test</div>'),
		$outer = $('<div style="width:200px;height:150px; position: absolute; top: 0; left: 0; visibility: hidden; overflow:hidden;"></div>').append($inner),
		inner = $inner[0],
		outer = $outer[0];

	$('body').append(outer);
	var width1 = inner.offsetWidth;
	$outer.css('overflow', 'scroll');
	var width2 = outer.clientWidth;
	$outer.remove();

	ubScrollBarWidth = width1 - width2;
	if (ubScrollBarWidth <= 0) ubScrollBarWidth = 2;
	};

// removeEmptyRows - remove any <tr></tr> combinations from all tables

var removeEmptyRows = function() {
	var rows = document.querySelectorAll('thead > tr, tbody > tr, tfoot > tr');
	for (var r = 0; r < rows.length; ++r) {
		if (rows[r].children.length == 0) rows[r].remove();
		}
	};

// scrollTableColumns - return an array that is the widths of the columns

var colWidths = new Array();
var noOfCols = 0;
var rowSpans = new Array();
var rowSpanCols = new Array();
var scrollTableColumns = function(table) {

	var tr = table.querySelectorAll('tr');
	var trLength = tr.length;

	for (var r = 0; r < trLength; ++r) {
		var colCurrent = 0;

		while (colCurrent < noOfCols && rowSpans[colCurrent] > 1) {
			--rowSpans[colCurrent];
			colCurrent += rowSpanCols[colCurrent];
			}

		var cells = tr[r].querySelectorAll(':scope > td, :scope > th');
		var cellLength = cells.length;

		for (var c = 0; c < cellLength; c += rowSpanCols[c]) {
			var colspan = cells[c].getAttribute('colspan');
			var rowspan = cells[c].getAttribute('rowspan');
			rowSpans[c] = rowspan == null ? 1 : parseInt(rowspan);
			rowSpanCols[c] = colspan == null ? 1 : parseInt(colspan);

			if (rowSpanCols[c] == 1) {
				thisWidth = cells[c].clientWidth + 1;
				if (colWidths[c] == undefined || thisWidth > colWidths[c]) colWidths[c] = thisWidth;
				}
			}

		noOfCols = colWidths.length;

		while (colCurrent < colWidths.length) {
			if (rowSpans[colCurrent] && rowSpans[colCurrent] > 1) --rowSpans[colCurrent];
			++colCurrent;
			}

//		var colspanFail = false;
//		if (colWidths.length == 0 || colWidths.length < colCurrent) {
//			colspanFail = true;
//		} else {
//			for (var i = 0 ; i < colWidths.length; ++i) { if (colWidths[i] == undefined) colspanFail = true; }
//			}
//		return colspanFail;
		}

	return colWidths;
	};

// resizeScrollableTables - set the column widths on the three parts of a scrollable table

var resizeScrollableTables = function() {
	var	HorizontalScroll = false;

	$("div[scrollDiv]").each(function(){
		var	currentTable = $(this).attr('scrollDiv');
		var	table = $('[scrollTable="'+currentTable+'"]');
		var	tbody;
		var	thead;
		var	tfoot;

		// Reset scrollDiv width if ubScrollWidth not defined otherwise get width of div to assign to table
		var ubScrollWidth = $(this).attr('ubScrollWidth');
		var divWidth = $(this).width();
		$(this).css({'max-width': 'auto', 'width': 'auto'});
		$(table).css({'max-width': '100%', 'width': 'auto'});

		// Move table rows from 'new' tables back to original table and hide the 'new' tables

		if ((thead = $('div[name="thead"]', this))) {
			$('thead', table).append($(thead).children('table').children('tbody').children('tr'));
			$(thead).hide();
			}

		if ((tbody = $('div[name="tbody"]', this))) {
			$('tbody', table).append($(tbody).children('table').children('tbody').children('tr'));
			$(tbody).hide();
			}

		if ((tfoot = $('div[name="tfoot"]', this))) {
			$('tfoot', table).append($(tfoot).children('table').children('tbody').children('tr'));
			$(tfoot).hide();
			}

		// Display table
		$(table).show();
		$(table).attr('style', $(table).attr('ostyle'));

		// set table width

		if ($(table).width() > winWidth - ubScrollBarWidth) {
			$(table).width(winWidth - ubScrollBarWidth - 2);
			if($(table).width() > winWidth - ubScrollBarWidth) {
				HorizontalScroll = true;
				}
			}

		if ($(table).attr('ubScrollWidth')) {
			var offset = $(table).offset();
			width = parseInt($(table).attr('ubScrollWidth'));
			var newWidth = Math.floor((winWidth - offset.left - 1) * width / 100) - (HorizontalScroll ? 1 : ubScrollBarWidth);
			newWidth -= Math.ceil($(table).outerWidth(true)) - Math.ceil($(table).outerWidth(true)) - 2;
			$(table).attr('_ubWidth', newWidth);
			$(table).width(newWidth);
			}

		// set div width

		// Calculate new column widths and set the widths on the new tables
		var colWidths = scrollTableColumns($(table)[0]);
		var colCurrent = colWidths.length;
		var widthSum = 0; for (var i = 0; i < colWidths.length; ++i) widthSum += colWidths[i] + 1;
		var tableWidth = widthSum;

		divWidth = tableWidth + ubScrollBarWidth + 2;

		// Hide table and display div
		$(table).hide();
		$(this).css({'min-width': divWidth});

		// Put table rows back in 'new' tables
		function putBackRows (section, sectionName) {
			var newTable = $('table', section);

			if ($(newTable)[0] === undefined) return 0;

			$(newTable).css({'table-layout': 'fixed'});
			$(newTable).children('tbody').append($(table).children(sectionName).children('tr'));
			$(newTable).children('thead').children('tr.ub_hidden').children().each(function(col) {
				$(this).css({'width': colWidths[col]});
				});
			$(section).show();

			return $(newTable)[0].scrollWidth;
			} ;

		if (thead) {
			tableWidth = putBackRows(thead, 'thead');
			divWidth = tableWidth + ubScrollBarWidth;
			$(thead).css({'min-width': tableWidth, 'width': tableWidth});
			$(this).css({'min-width': divWidth, 'width': divWidth});
			}
		if (tbody) {
			$(tbody).css({'min-width': divWidth, 'width': divWidth});
			putBackRows(tbody, 'tbody');
			}
		if (tfoot) {
			$(tfoot).css({'min-width': tableWidth, 'width': tableWidth});
			putBackRows(tfoot, 'tfoot');
			}
		});
	};

// makeScrollableTables - find all the "scrollable" tables and convert them to divs with embedded tables
//
// <div name="scrollTable">
//	<div name="thead" class="thead"><table><!-- thead --></table></div>
//	<div name="tbody" class="tbody"><table><!-- tbody --></table></div>
//	<div name="tfoot" class="tfoot"><table><!-- tfoot --></table></div>
//	</div>

var makeScrollableTables = function(context) {
	var tableWidth = 0;

	$("div.scrollTable", $(context)).each(function(){
		// add a table for splitting the original table
		function scrollTable(table, collapsecells) {
			var newTable = $('<table><thead></thead><tbody></tbody><tfoot></tfoot></table>').insertBefore($(table));
			$(newTable).css({'display' : 'inline-table', 'margin' : '0px', 'top' : '0px', 'vertical-align' : 'top', 'width': tableWidth+'px'});

			var hiddenRow = $('<tr class="ub_hidden" />');
			for (var col = 0; col < colCurrent; ++col) {
				var newTh = $('<th />');
				if (collapsecells > 0) { $(newTh).attr('collapseCell', 'yes'); }
				$(newTh).width(colWidths[col]);
				$(newTh).css({'padding-top' : '0px', 'padding-bottom' : '0px'});
				$(hiddenRow).append($(newTh));
				}
			$('thead', newTable).append($(hiddenRow));

			return newTable;
			}

		// add a div to wrap the table splits
		function scrollDiv(name, scrollBar) {
			var div = $('<div class="'+name+'" name="'+name+'" />');
			if (scrollBar) {
				$(div).css({'overflow-y' : 'scroll', 'text-align' : 'left', 'vertical-align' : 'top'});
			} else {
				$(div).css({'text-align' : 'left', 'vertical-align' : 'top'});
				}
			$(div).width(divWidth);

			return div;
			}

		// first set table height and possibly width

		var table = $(this).children('table');
		if (!$(table).is('[ubWrapped]')) {
			if ($(window).width() == $(table).outerWidth(true)) {
				tableWidth -= ubScrollBarWidth + 1;
				$(table).css({'width': tableWidth, 'max-width': tableWidth});
				}

			// At this time the column widths are correct, so make a note of them
			var colWidths = scrollTableColumns($(table)[0]);
			var colCurrent = colWidths.length;
			tableWidth = Math.ceil($(table).outerWidth(true)) + colCurrent;

			if (tableWidth >= winWidth - ubScrollBarWidth) {tableWidth = winWidth - ubScrollBarWidth - 2;}

			// divWidth sets the correct width to the wrapping table section div
			var divWidth = tableWidth + ubScrollBarWidth;
			var collapseCells = $('[collapsecell]', table).length;

			// add div and table for new header, add a hidden row to set column widths, and move thead rows to this table, then remove thead
			if ($("thead tr", table).length > 0) {
				var theadTable = scrollTable(table, collapseCells);
				var theadId = $('thead', table).attr('id');
				$(theadTable).wrap(scrollDiv('thead', false));
				if (theadId) {
					$('thead', table).removeAttr('id');
					$('tbody', theadTable).attr('id', theadId);
					}
				$('tbody', theadTable).append($(table).children('thead').children('tr'));
				}

			// add scrollable div around tbody
			var tbodyTable = scrollTable(table, collapseCells);
			var tbodyId = $('tbody', table).attr('id');
			$(tbodyTable).wrap(scrollDiv('tbody', true));
			if (tbodyId) {
				$('tbody', table).removeAttr('id');
				$('tbody', tbodyTable).attr('id', tbodyId);
				}
			$('tbody', tbodyTable).append($(table).children('tbody').children('tr'));

			// add div and table for new footer and move tfoot rows to this table, then remove tfoot
			if ($("tfoot tr", table).length > 0) {
				var tfootTable = scrollTable(table, collapseCells);
				var tfootId = $('tfoot', table).attr('id');
				if (tfootId) {
					$('tfoot', table).removeAttr('id');
					$('tbody', tfootTable).attr('id', tfootId);
					}
				$('tbody', tfootTable).append($(table).children('tfoot').children('tr'));
				$(tfootTable).wrap(scrollDiv('tfoot', false));
				}

			// remove original table
			$(table).removeAttr('ubWrapped');
			$(table).hide();
			}
		});
	};

// print tables for Firefox

var windowPrint = function () {
        var inlineTables = [ ];
	for (var tables = document.querySelectorAll('table'), table = 0; table < tables.length; ++table) {
		if (window.getComputedStyle(tables[table],null).getPropertyValue('display') === 'inline-table') {
			inlineTables.push(tables[table]);
			tables[table].style.display = 'table';
			}
		}
        var inlineBlocks = [ ];
	for (var blocks = document.querySelectorAll('div, fieldset'), block = 0; block < blocks.length; ++block) {
		if (window.getComputedStyle(blocks[block],null).getPropertyValue('display') === 'inline-block') {
			inlineBlocks.push(blocks[block]);
			tables[block].style.display = 'block';
			}
		}
	window.print();
	while (inlineTables.length) inlineTables.shift().style.display = 'inline-table';
	while (inlineBlocks.length) inlineBlocks.shift().style.display = 'inline-block';
	}

// How many scrollable tables are there?

var tableNumber = 0;

// wrapScrollableTable - wrap a div - class scrollTable - around the scrollable tables

var wrapScrollableTable = function(table) {
	var	value;
	var	maxTableWidth = winWidth - ubScrollBarWidth; // - 2;
	var	tableWidth = $(table).outerWidth(true) + 1;		// allow for decimal widths

	// Make sure table is not too wide
	if (tableWidth > maxTableWidth) {
		$(table).width(maxTableWidth);
		$(table).css('max-width', maxTableWidth);
		$(table).css('width', maxTableWidth);
		}

	// wrap with new div
	var	newDiv = $('<div name="scrollTable"></div>');
	$(newDiv).attr('class', $(table).attr('class'));
	$(newDiv).css({'overflow' : 'hidden'});
	if ((value = $(table).attr('ubScrollHeight'))) { $(newDiv).attr('ubScrollHeight', value); }

	// Try to get correct width for surrounding div
	$(table).attr('ostyle', $(table).attr('style'));
	$(newDiv).width(tableWidth + ubScrollBarWidth);
	if ((value = $(table).attr('ubScrollWidth'))) { $(newDiv).attr('ubScrollWidth', value); }

	$(newDiv).removeClass('scrollable').addClass('scrollTable');
	if ($(newDiv).hasClass('inline-table')) { $(newDiv).removeClass('inline-table').addClass('inline-block'); }

	// add attribute so we can find them again for resizing
	$(newDiv).attr('scrollDiv', 'table'+tableNumber);
	$(table).attr('scrollTable', 'table'+tableNumber);
	++tableNumber;

	$(table).wrap(newDiv);
	}

// wrapScrollableTables - wrap a div - class scrollTable - around the scrollable tables
//
// if id is given, only do it for the tables in id

var wrapScrollableTables = function(id) {
	var wrapContext = id ? $('#'+id) : $('body');
	$('table[scrollable], table.scrollable', $(wrapContext)).each(function() {
		if (!$(this).attr('ubScrollHeight')) $(this).attr('ubScrollHeight', "100");
		if (!$(this).attr('ubScrollWidth')) $(this).attr('ubScrollWidth', "0");
		$(this).removeAttr('scrollable');
		$(this).removeClass('scrollable');
		ub_layout.wrapScrollableTable(this);
		});
	makeScrollableTables(wrapContext);
	};

// makeCollapsibleLists - find all li elements with class 'collapsible' and turn them into collapsible lists, add the folder icons

var makeCollapsibleLists = function() {
	// Add folder icons
	$('li.collapsible').each(function() {
		// add a div before text
		var newOpen = $('<div style="display: inline-block; margin: 0 0.2em;" onclick="ub_layout.showList(event);"><img src="/images/folder.open.gif"/></div>');
		var newClosed = $('<div style="display: inline-block; margin: 0 0.2em;" onclick="ub_layout.showList(event);"><img src="/images/folder.closed.gif" /></div>');
		$(this).prepend(newOpen, newClosed);
		newOpen.hide();
		// offset the collapsed list
		$(this).children('ol, ul').css({'margin-left' : '24px'});
		});

	// hide the ul/ol
	$('li.collapsible > ul, li.collapsible > ol').hide();
	};

// showList - show/hide collapsible list

var showList = function(e) {
	var target = $(e.target).parents('li.collapsible').first();
	$(target).children('ol, ul, div').toggle();
	e.stopPropagation();
	resize();
	};

// layoutCss - add css values to an object

var layoutCss = function (style) {
	var styles = Object.keys(style);

	for (var k = 0; k < styles.length; ++k) this.style[styles[k]] = style[styles[k]];
	};

// end of ub_layout

	return {
		init: init,
		domFix: domFix,
		loadPrevious: loadPrevious,
		makeScrollableTables: makeScrollableTables,
		reserve: reserve,
		resize: resize,
		showList: showList,
		tableCollapse: tableCollapse,
		tableInit: tableInit,
		trCollapse: trCollapse,
		trHide: trHide,
		windowPrint: windowPrint,
		wrapScrollableTable: wrapScrollableTable,
		wrapScrollableTables: wrapScrollableTables
		};
	})();

ub_layout.loadPrevious = window.onload; window.onload = ub_layout.init;
