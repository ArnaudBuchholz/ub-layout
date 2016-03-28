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
var ReservedHeight = 0;			// reserved pixels at the bottom of the screen
var ReservedWidth = 0;			// reserved pixels on the right hand side of the screen
var ubScrollBarWidth = 0;		// detected scrollbar width
var winHeight = 0;			// available viewport height
var winWidth = 0;			// available viewport width

// init - initialisation

var init = function (reservedHeight, reservedWidth) {
	if (reservedHeight) {ReservedHeight = reservedHeight}
	if (reservedWidth) {ReservedWidth = reservedWidth}

	if (typeof window.addEventListener == 'function') {
		window.addEventListener('resize',ub_layout.resize,false);
	} else if (typeof window.attachEvent == 'function') {
		window.attachEvent('resize',ub_layout.resize);
		}

	getViewportSize();
	scrollbarWidth();
	tableInit ();
	};

// Limit resize events

var timeOut = null;
var resize = function(){
	if(timeOut != null) clearTimeout(timeOut);
	timeOut = setTimeout(ub_layout.domFix, 300);
	};

// getViewportSize - Get the available size in pixels of the viewport

var getViewportSize = function() {
	winWidth = window.innerWidth - ReservedWidth;
	winHeight = window.innerHeight - ReservedHeight - 1 - (HorizontalScroll ? ubScrollBarWidth : 0);
	};


// object scroll height and width fixing

var domFix = function() {
	getViewportSize();
	if (winWidth <= 1 || winHeight <= 1) return;

	resizeScrollableTables();
	$('body').children().each(function() { domShrink(this); });
	$('body').children().each(function() { domWalk(this); });
	};

var domShrink = function(node) {
	var tagName = $(node).prop('tagName');
	if ($(node).is('[scrollable]') || $(node).hasClass('scrollable') || $(node).hasClass('scrollTable')) {
		if (tagName != 'TABLE' && !$(node).hasClass('scrollTable')) {
			if (!$(node).attr('ubScrollHeight')) $(node).attr('ubScrollHeight', "100");
			if (tagName == 'IFRAME' && !$(node).attr('ubScrollWidth')) $(node).attr('ubScrollWidth', "100");
			}
		if ($(node).attr('ubScrollHeight')) {$(node).css({'height' : '0px'}); }
		if ($(node).attr('ubScrollWidth') && parseInt($(node).attr('ubScrollWidth')) != 0) { $(node).css({'width' : '0px'}); }
		}
	if (tagName != 'SCRIPT') { $(node).children().each(function() { domShrink(this); })}
	};

var domWalk = function(node) {
	var tagName = $(node).prop('tagName');

	if ($(node).is('[scrollable]') || $(node).hasClass('scrollable') || $(node).hasClass('scrollTable')) {
		nodeFixHeight(node);
		}
	if (tagName != 'SCRIPT') { $(node).children().each(function() { domWalk(this); })}
	};

// nodeFixHeight - set height of node to a percentage of remaining viewport height

var nodeFixHeight = function(node) {
	var height;
	var width;
	var offset = $(node).offset();

	/* this is simple as all we have to do is put up a scroll bar and calculate the height as a percentage of the available height */
	if ((height = parseInt($(node).attr('ubScrollHeight')))) {
		if ($(node).is('[scrollable]') || $(node).hasClass('scrollable')) {
			if ($(node).attr('scrollable') == undefined || $(node).attr('scrollable') == '') {
				$(node).css({'overflow-y' : 'auto'});
			} else {
				$(node).css({'overflow-x' : 'auto', 'overflow-y' : 'hidden', 'display' : 'flex', 'flex-direction' : 'row', 'flex-wrap' : 'nowrap'});
				}
			}

		var offsetTop = Math.ceil(offset.top);
		var newHeight = Math.floor((winHeight - offsetTop) * height / 100) + (HorizontalScroll ? ubScrollBarWidth : 0);
		newHeight -= Math.ceil($(node).outerHeight(true)) - 1;

		if (newHeight < 0) newHeight = 0;
		$(node).height(newHeight);

		// if the node has class 'scrollTable' then we have to set the height of the child 'tbody' node
		if ($(node).hasClass('scrollTable')) {
			// fix a couple of css attributes
			$('table', node).css({'margin' : '0px', 'top' : '0px', 'left' : '0px'});
			// set the height of the thead and tfoot divs to the height of the internal table
			var tbodyHeight = newHeight - (HorizontalScroll ? ubScrollBarWidth : 0);
			var tableNode;
			if ((tableNode = $('[name = "thead"]', node)).length > 0) {
				tbodyHeight -= $(tableNode).outerHeight();
				}
			if ((tableNode = $('[name = "tfoot"]', node)).length > 0) {
				tbodyHeight -= $(tableNode).outerHeight();
				}
			// now set tbody height if table height > tbodyHeight
			--tbodyHeight;
			if (tbodyHeight < 0) tbodyHeight = 0;
			var currentHeight = $('[name = "tbody"] table', node).outerHeight();
			if (currentHeight < tbodyHeight) tbodyHeight = currentHeight;
			$('[name = "tbody"]', node).height(tbodyHeight);
			}
		}

	// ubScrollWidth
console.info($(node).prop('tagName'));
	if (!$(node).hasClass('scrollTable')) {
console.info('not scrollTable');
		if ((width = parseInt($(node).attr('ubScrollWidth')))) {
			var newWidth = Math.floor((winWidth - offset.left /* - 1 */) * width / 100);
			newWidth -= Math.ceil($(node).outerWidth(true)); /* - 1 + ubScrollBarWidth; */
			$(node).css({'width' : newWidth});
			}
	} else if ($(node).attr('ubScrollWidth') && parseInt($(node).attr('ubScrollWidth')) != 0) {
console.info('scrollTable');
		var currentTable = $(node).attr('scrollDiv');
		table = $('[scrollTable="'+currentTable+'"]');

		var tableWidth = parseInt($(table).attr('_ubWidth'));
		var divWidth = tableWidth + ubScrollBarWidth;
console.info('_ubWidth '+$(table).attr('_ubWidth')+' tableWidth '+tableWidth+' divWidth '+divWidth);

		// Hide table and display div
		$(node).width(divWidth);
		$(node).css({'overflow-x' : 'auto'});
		}
	if ($(node).width() > winWidth) {
		$(node).width(winWidth);
		}

	};

// tableCollapse - Search all the tables for any that have attribute collapseLevel defined on a table row
//			If found, put an extra column at the start of every row in the table

var tableCollapse = function() {

	/* Search every table */
	$('table').each(function() {
		var found = false;

		/* Search TR nodes for an attribute 'collapseLevel' */
		$(this).children().children('tr').each(function() { if ($(this).attr('collapseLevel')) { found = true; return false; }});

		/* Add extra column to every row */
		if (found) {
			$(this).children().children('tr').each(function() {
				if ($('[collapsecell]', this).length == 0) {
					var newTD = $('<td collapseCell="yes"></td>');
					$(newTD).css({'width' : '1em'});
					if ($(this).attr('collapseLevel')) {
						$(newTD).addClass('collapse');
						$(newTD).attr('onclick', 'ub_layout.trCollapse(event)');

						/* Add attribute 'collapseState' and give default value 'open'. Other value is 'hide' */
						if (!$(this).attr('collapseState')) { $(this).attr ('collapseState', 'open'); }
						/* Add attribute 'collapseDirection' and give default value 'after'. Other value is 'before'. */
						if (!$(this).attr('collapseDirection')) { $(this).attr ('collapseDirection', 'after'); }
						if ($(this).attr('collapseState') == 'open') { $(newTD).text("-"); } else { $(newTD).text("+"); }
						}
					$(this).prepend(newTD);
					}
				});
			}
		});
	};

// tableInit - initialise tables and fix layout

var tableInit = function () {
	tableReverse();
	removeEmptyRows();
	tableCollapse();
	wrapScrollableTables();
	$('tr[collapseState = "hide"]').each(function() {trHide (this, $(this).attr('collapseDirection'))});
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
	var state = tr.getAttribute('collapseState');
	var direction = tr.getAttribute('collapseDirection');
	if (state == 'open') {
		trHide(tr, direction);
		tr.setAttribute('collapseState', 'hide');
		tr.firstChild.innerHTML = "+";
	} else {
		trShow(tr, direction);
		tr.setAttribute('collapseState', 'open');
		tr.firstChild.innerHTML = "-";
		}

	domFix();
	};

// trHide - hide a row

var trHide = function(tr, direction) {
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

var trShow = function(tr, direction) {
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
	$('table').children('thead, tbody, tfoot').children('tr').each(function() {
		if ($(this).children().length == 0) {
			// remove empty row
			$(this).remove();
			}
		});
	};

// scrollTableColumns - return an array that is the widths of the columns

var scrollTableColumns = function(table) {
	var colWidths = new Array();
	var colCurrent = 0;
	var noOfCols = 0;
	var rowSpans = new Array();
	var rowSpanCols = new Array();

	$(table).children('thead, tbody, ttail').children('tr').each(function() {
		colCurrent = 0;

		while (colCurrent < noOfCols && rowSpans[colCurrent] > 1) {
			--rowSpans[colCurrent];
			colCurrent += rowSpanCols[colCurrent];
			}

		$(this).children().each(function() {

			if ($(this).attr('rowspan')) rowSpans[colCurrent] = parseInt($(this).attr('rowspan')); else rowSpans[colCurrent] = 1;
			if ($(this).attr('colspan')) rowSpanCols[colCurrent] = parseInt($(this).attr('colspan')); else rowSpanCols[colCurrent] = 1;

			if (rowSpanCols[colCurrent] == 1) {
				colWidths[colCurrent] = Math.ceil($(this).outerWidth(true));
				++colCurrent;
			} else {
				colCurrent += rowSpanCols[colCurrent];
				}

			});

		noOfCols = colWidths.length;

		while (colCurrent < colWidths.length) {
			if (rowSpans[colCurrent] && rowSpans[colCurrent] > 1) --rowSpans[colCurrent];
			++colCurrent;
			}

		var colspanFail = false;
		if (colWidths.length == 0 || colWidths.length < colCurrent) {
			colspanFail = true;
		} else {
			for (var i = 0 ; i < colWidths.length; ++i) { if (colWidths[i] == undefined) colspanFail = true; }
			}
		return colspanFail;
		});

	if (ubScrollBarWidth == 0) {for (i = 0; i < colCurrent; ++i) {++colWidths[i];}}

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
		$(this).css({'width': 'auto'});
		$(this).css({'max-width': 'auto'});
		$(table).css({'width': 'auto'});
		$(table).css({'max-width': '100%'});
		$(this).width('auto');
		$(table).width('auto');

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
		var colWidths = scrollTableColumns(table);
		var colCurrent = colWidths.length;
		var widthSum = 0; for (var i = 0; i < colWidths.length; ++i) widthSum += colWidths[i] + 1;
		var tableWidth = widthSum;
		var divWidth = tableWidth + ubScrollBarWidth + 2;

		// Hide table and display div
		$(table).hide();
		$(this).css('min-width', divWidth);

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
			var colWidths = scrollTableColumns(table);
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
console.info('new width '+tableWidth+' '+ubScrollBarWidth);
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

// end of ub_layout

	return {
		init: init,
		domFix : domFix,
		makeScrollableTables: makeScrollableTables,
		resize : resize,
		showList : showList,
		tableCollapse : tableCollapse,
		tableInit: tableInit,
		trCollapse : trCollapse,
		trHide : trHide,
		wrapScrollableTable: wrapScrollableTable,
		wrapScrollableTables: wrapScrollableTables
		};
	})();

$(window).load(function(){ ub_layout.init(); });
