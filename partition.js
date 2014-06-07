/**
* jQuery Partition Editor Plugin
* Version: 0.2.0
* URL: http://github.com/vanders/jspartition
* Description: JQuery plugin to make a partition editor widget.
* Requires: JQuery
* Author: Kristian Van Der Vliet
* Copyright: 2011 Andrea Stagi, 2014 Kristian Van Der Vliet
* License: MIT (included in the source)
*/
$(function() {
    var nElements = 0;

    var ranges = [];
    var totalRangeWidth = 0;

    var cursorMap = {};
   
    var currentCursor = {
        selectedCursor: 0,
        leftRangeDivId: null,
        rightRangeDivId : null,
        leftRangeDivNum: 0,
        rightRangeDivNum: 0,
        oldPosition : 0,
    };

    var mouseMoveContext = {
        delta: 0,
        widthLeft : 0,
        widthRight : 0,
        widthTotal : 0,
        oldValue : -1,
        widths : []
    };

    var nextColor = 0;
    
    $.widget("custom.partition", {
        options: {
            ranges: [{label: "One", value: 25},
                     {label: "Two", value: 25},
                     {label: "Three", value: 25},
                     {label: "Four", value: 25}],
            labels: {show: true, size: "x-small", color: "black"},
            colors: [ "green", "blue", "red", "yellow" ],
            cursor: {color : "darkgrey", width: 5},
            control: {height: 30, color: "whitesmoke"},
            abs: {value: 100, units: ""},
            create: null,
            onCursorDrag: null,
            onAdd: null,
            onClear: null
        },

        _create: function() {
            var containerDiv, partitionControlDiv, buttonsDiv, dataDiv;
            var normWidth;
            
            ranges = this.options.ranges.slice(0);
            nElements = ranges.length;

            /* Top level container for the control */
            containerDiv = $("<div style='background-color:transparent;" +
                             "height:" + this.element.height() + "px;" +
                             "width:100%;'" +
                             "id='partitionContainer'" +
                             "class='partitionContainer'>");
            this.element.append(containerDiv);
            
            /* The partition widget proper */
            partitionControlDiv = $("<div style='background-color:transparent;" +
                                    "height:" + this.options.control["height"] + "px;" +
                                    "width:100%;'" +
                                    "id='partitionControl'" +
                                    "class='partitionControl'>");
            partitionControlDiv.append("<div id='partitionClear', style='clear:both'>");

            containerDiv.append(partitionControlDiv);

            /* Partition widget controls */
            buttonsDiv = $("<div style='background-color:" + this.options.control["color"] + ";" +
                           "height:" + this.options.control["height"] + "px;" +
                           "width:100%;" + 
                           "padding:5px;'" +
                           "id='partitionButtons'" +
                           "class='partitionButtons'>");
            containerDiv.append(buttonsDiv);
                
            /* Data about each range */
            dataDiv = $("<div style='background-color:transparent;" +
                        "height:" + (this.element.height() - (this.options.control["height"] * 2)) + "px;" +
                        "width:100%;'" +
                        "id='partitionData'" +
                        "class='partitionData'>");
            containerDiv.append(dataDiv);

            this._createButtons();

            normWidth = (this.element.width() - (this.options.cursor.width) * (nElements - 1)) / 100;

            for(var i = 0; i < nElements; i++) {
                var range = ranges[i]
                var rangeWidth = range["value"] * normWidth;

                this._appendRange(i, rangeWidth, range["label"]);
                
                if (i != nElements - 1)
                    this._appendCursor(i);

                range["abs"] = Math.round(range["value"] * (this.options.abs["value"] / 100));
            }            
            this._setupEvents();

            this._calculateRangeWidth();
            this._refreshData();
            
            if (this.options.create != null)
                this.options.create(this.options.ranges, this.options.colors);
        },

        _createButtons: function() {
            var buttonsDiv = this.element.find("#partitionButtons");
            var buttonsHtml="";
            
            buttonsHtml += "<input type='button'" +
                           "id='partitionBtnAdd'" +
                           "onclick=\"$('#partition').partition('add');\"" +
                           "value='Add'>" +
                           "</input>";

            buttonsHtml += "<input type='button'" +
                           "id='partitionBtnClear'" +
                           "onclick=\"$('#partition').partition('clear');\"" +
                           "value='Clear'>" +
                           "</input>";
            
            buttonsDiv.html(buttonsHtml);
        },
        
        _appendCursor: function(id) {
            var cursorId = "cursor" + id;
            div = "<div style='float:left;" +
                  "background-color:" + this.options.cursor.color + ";" +
                  "cursor:ew-resize;" +
                  "height:" +  this.options.control["height"] + "px;" +
                  "width:" + this.options.cursor.width + "px;' " +
                  "id='" + cursorId + "' class='dragCursor'>";
            $(div).insertBefore('#partitionClear');
            cursorMap[cursorId] = id;
        },
                
        _getRangeColor: function(id) {
            var color=this.options.colors[nextColor];
            nextColor += 1;
            if(nextColor == this.options.colors.length )
                nextColor = 0;

            return color;
        },
        
        _appendRange: function(id, width, label) {
            var height = this.options.control["height"];

            div = $("<div style='float:left;" +
                    "background-color:" + this._getRangeColor(id) + ";" +
                    "color:" + this.options.labels["color"] + ";" +
                    "font-size:" + this.options.labels["size"] + ";" +
                    "text-align:center;" +
                    "white-space:nowrap;" +
                    "position: relative;" +
                    "line-height:" + height + "px;" +
                    "height:" + height + "px;" +
                    "width:" + width + "px;' " +
                    "id='range" + id + "' "+
                    "class='rangeDiv'>");

            mouseMoveContext.widths[id] = width;
            
            div.insertBefore('#partitionClear');
            
            if(this.options.labels["show"] && label != "")
                div.html(label);
        },

        _calculateRangeWidth: function() {
            var normWidth = (this.element.width() - (this.options.cursor.width) * (nElements - 1)) / 100;
            totalRangeWidth = 0;
            
            for(var i = 0; i < nElements; i++) {
                var range = ranges[i]
                var rangeWidth = range["value"] * normWidth;

                totalRangeWidth += rangeWidth;
            }
            totalRangeWidth = Math.round(totalRangeWidth);
        },

        _setupEvents: function() {
            this._on(this.document, {
                "mousedown.dragCursor": function(event) {this._onMouseDown(event);}
            });
        },
        
        _onMouseDown: function(event) {
            var cursor = event.currentTarget;
            var selectedCursor = cursorMap[cursor.id];
            
            currentCursor.selectedCursor = selectedCursor;

            currentCursor.leftRangeDivNum = selectedCursor;
            currentCursor.rightRangeDivNum = selectedCursor + 1;
            currentCursor.leftRangeDivId = "#" + cursor.previousElementSibling.id;
            currentCursor.rightRangeDivId = "#" + cursor.nextElementSibling.id;
                
            currentCursor.oldPosition = event.pageX;

            mouseMoveContext.widthTotal = $(currentCursor.leftRangeDivId).width() + $(currentCursor.rightRangeDivId).width();

            /* Bind to the document level events; we're already bound to the mousedown event on the cursor */
            this._on(this.document, {
                "mousemove": function(event) {this._onMouseMove(event);event.preventDefault();},
                "mouseup": function(event) {this._onMouseUp(event);event.preventDefault();}
            });
            event.preventDefault();            
        },
        
        _rangeData: function() {
            for(var i = 0; i < nElements; i++) {
                var range = ranges[i]
                console.log( "range" + i + "= " + range["value"]);
            }                
        },
        
        _onMouseMove: function(event) {
            var selectedCursor = currentCursor.selectedCursor;
            var left = ranges[selectedCursor];
            var right = ranges[selectedCursor + 1]
            
            if(mouseMoveContext.oldValue == -1)
                mouseMoveContext.oldValue = left["value"] + right["value"];

            with(mouseMoveContext) {
                if (currentCursor.oldPosition == event.pageX)
                    return;

                delta = currentCursor.oldPosition - event.pageX;

                widthLeft = widths[currentCursor.leftRangeDivNum] - delta;
                widthRight = widths[currentCursor.rightRangeDivNum] + delta;
                
                if (widthLeft < 0 || widthRight < 0)
                {
                    currentCursor.oldPosition = event.pageX;
                    return;
                }

                widths[currentCursor.leftRangeDivNum] = widthLeft;
                widths[currentCursor.rightRangeDivNum] = widthRight;
                $(currentCursor.leftRangeDivId).width(widthLeft);
                $(currentCursor.rightRangeDivId).width(widthRight);
                    
                currentCursor.oldPosition = event.pageX;
            }

            left["value"] = Math.round(mouseMoveContext.widthLeft / totalRangeWidth * 100);
            right["value"] = Math.round(mouseMoveContext.widthRight / totalRangeWidth * 100);

            left["abs"] = Math.round(left["value"] * (this.options.abs["value"] / 100));
            right["abs"] = Math.round(right["value"] * (this.options.abs["value"] / 100));

            this._normalizeValues(left["value"], right["value"]);

            if(left["value"] == 0)
            {
                $(currentCursor.rightRangeDivId).width(mouseMoveContext.widthLeft + mouseMoveContext.widthRight);
                $(currentCursor.leftRangeDivId).width(0);
            }

            if(right["value"] == 0)
            {
                $(currentCursor.leftRangeDivId).width(mouseMoveContext.widthLeft + mouseMoveContext.widthRight);
                $(currentCursor.rightRangeDivId).width(0);
            }

            /* Inform the data control and callback about the changes */
            this._updateData();
            if (this.options.onCursorDrag != null)
                this.options.onCursorDrag(selectedCursor, ranges);
        },

        _onMouseUp: function(event) {
            this._off(this.document, "mousemove");
            this._off(this.document, "mouseup");

            mouseMoveContext.oldValue = -1;
        },

        _normalizeValues: function(left, right) {
            var delta = (left["value"] + right["value"]) - mouseMoveContext.oldValue;
            if(left["value"] > right["value"])
                right["value"] -= delta;
            else
                left["value"] -= delta;
        },

        _refreshData: function() {
            var dataDiv = this.element.find("#partitionData");
            var dataHtml = "";
            
            dataHtml += "<ul>";
            for(var i = 0; i < nElements; i++) {
                var range = ranges[i];

                dataHtml += "<dt id='dataLabel" + i + "'>" +
                            range["label"] + "</dt>" +
                            "<dd id='dataVal" + i + "'>" +
                            "</dd>" +
                            "<dd id='dataAbs" + i + "'>" +
                            "</dd>";
            }
            dataHtml += "</ul>";
            
            dataDiv.html(dataHtml);
            
            this._updateData();
        },
        
        _updateData: function() {
            for(var i = 0; i < nElements; i++) {
                var range = ranges[i];
                var dataVal = "#dataVal" + i;
                var dataAbs = "#dataAbs" + i;
                
                $(dataVal).html(range["value"] + "%");
                $(dataAbs).html(range["abs"] + this.options.abs["units"]);
            }
        },
        
        _createInitial: function(parameters) {
            ranges = [{label: parameters["label"], value: 100, abs: this.options.abs["value"]}];
            nElements = 1;
                
            var normWidth = (this.element.width() - (this.options.cursor.width) * (nElements - 1)) / 100;
            var rangeWidth = 100 * normWidth;

            this._appendRange(0, rangeWidth, parameters["label"]);
        },
        
        _insertAtEnd: function(parameters) {
            var lastId = nElements - 1;
            var newId = nElements;
            var lastRangeId = "#range" + lastId;
            var lastWidth = mouseMoveContext.widths[lastId]
            var lastValue = ranges[lastId]["value"];
            var label = parameters["label"];

            console.log("lastRangeId: " + lastRangeId + ", lastWidth: " + lastWidth);
            console.log("lastId: " + lastId + ", newId: " + newId);
            
            var newWidth = (lastWidth - this.options.cursor.width) / 2;
            var newValue = lastValue / 2;
            
            $(lastRangeId).width(newWidth);
            nElements += 1;

            this._appendCursor(lastId);
            this._appendRange(newId, newWidth, label);
            
            mouseMoveContext.widths[lastId] = newWidth;
            mouseMoveContext.widths[newId] = newWidth;

            var abs = Math.round(newValue * (this.options.abs["value"] / 100));

            ranges[lastId]["value"] = newValue;
            ranges[lastId]["abs"] = abs;
           
            ranges[newId] = {value: newValue, abs: abs, label: label};
        },
        
        add: function(parameters) {
            parameters = parameters || {};

            if( !("label" in parameters) )
                parameters["label"] = "New " + nElements;
            
            if( nElements > 0 ){
                this._insertAtEnd(parameters);
            } else {
                this._createInitial(parameters);
            }
            
            this._setupEvents();
            this._calculateRangeWidth();
            this._refreshData();
            
            if (this.options.onAdd != null)
                this.options.onAdd(this.options.ranges, this.options.colors);
        },
        
        clear: function() {
            var doClear = true;
            
            if (this.options.onClear != null)
                doClear = this.options.onClear(this.options.ranges, this.options.colors);

            if (doClear){
                /* Remove the existing ranges & cursors */
                $(".dragCursor").remove();
                $(".rangeDiv").remove();

                /* Reset all values to defaults */
                nElements = 0;
                ranges = [];
                totalRangeWidth = 0;
                cursorMap = {};

                currentCursor = {
                    selectedCursor: 0,
                    leftRangeDivId: null,
                    rightRangeDivId : null,
                    leftRangeDivNum: 0,
                    rightRangeDivNum: 0,
                    oldPosition : 0,
                };

                mouseMoveContext = {
                    delta: 0,
                    widthLeft : 0,
                    widthRight : 0,
                    widthTotal : 0,
                    oldValue : -1,
                    widths : []
                };
                nextColor = 0;

                /* Create an initial range */            
                this.add();
            }
        }
    })
});
