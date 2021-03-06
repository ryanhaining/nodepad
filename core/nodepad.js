/*
   nodepad.js
   
   Copyright 2014 Joe Tannenbaum <joseph.i.tannenbaum@gmail.com>
   
   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 2 of the License, or
   (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
   MA 02110-1301, USA.
   
   
*/

var mouseX = 0,
    mouseY = 0;
$(document).mousemove(function (e) {
    "use strict";
    mouseX = e.pageX;
    mouseY = e.pageY;
});

var s = Snap("#svg");
var allshapes = Snap.set();
var allnodes = Snap.set();
var danglingedgepolicy = 1;

var highlightColor = "orange";
var edgeColor = "#000";
var palette = {
    49: "#bada55",
    50: "#C14C44",
    51: "#da55ba",
    52: "#c89dbf",
    53: "#dab855",
    54: "#55bada"
};
var currentcolor = "#bada55";
var nodeRadius = 36;

/*var cogsvg=null;
var cogcircle = s.circle(8,8,8);
cogcircle.attr({fill:"#fff", opacity: 0});
var newcog;
Snap.load("http://localhost:8000/cog.svg", function (f) {
    var cog = f.select("g");
    cog.attr({fill: "#adbbc6"});
    cog.transform('s0.25'); 
    //cogcircle.after(cog);
    newcog = s.group(cog, cogcircle);
    newcog.attr({display:"none"});
    newcog.mouseover(function(){
        this.attr({fill: "orange"});
    })
    newcog.mouseout(function(){
        this.attr({fill: "#adbbc6"});
    }) 
});*/

var nodecount = 1;
var nodes = [];
var hoverednode = null;
var lasthoverednode = null;
var dragging = false;
var sourcenode = null;
var hoverededge = null;
var edgestretchloop = null;

function clearShapes(allshapes) {
    allshapes.forEach(function (item) {
        item.remove();
    }, allshapes);
    hoverededge = null;
    sourcenode = null;
    hoverednode = null;
    edgestretchloop = null;
    nodecount = 1;
    nodes = [];
    allnodes = Snap.set();
    allshapes = Snap.set();
}

function removeNode(allnodes, node) {
    if (danglingedgepolicy === 1) { // remove all rays with the node
        node.rays.forEach(function (item) {
            allshapes.exclude(item);
            item.remove();
        });
    } else if (danglingedgepolicy === 2) { // dangle them? ??
        
    }
    allnodes.exclude(node);
    allshapes.exclude(node);
    node.remove();
}

function cancelEdge() {
    clearInterval(edgestretchloop);
    if (hoverededge) { hoverededge.remove() };
    hoverededge = null;
    sourcenode = null;
    edgestretchloop = null;
}

function pullAheadAll(allnodes, obj) {
    "use strict";
    allnodes.forEach(function (item) {
        obj.before(item);
    }, allnodes);
}
function pushBehindAll(allnodes, obj) {
    "use strict";
    allnodes.forEach(function (item) {
        obj.after(item);
    }, allnodes);
}

function makeNewNode(x, y, fill, nohighlight) {
    "use strict";
    var nodeCircle = s.circle(x, y, nodeRadius);
    nodeCircle.attr({
        fill: fill, // is #bada55 intellectual property?
        stroke: nohighlight ? "#000" : highlightColor,
        strokeWidth: 5
    });

    var nodeLabel = s.text(x - 5, y + 5, nodecount);
    nodeLabel.attr({
        "font-size": "20px"
    });
    
    /*var cog;
    cog = newcog.clone();
    cog.attr({display:"block"});
    var cogx = x+3;
    var cogy = y+4;
    cog.transform("t"+cogx+","+cogy);
    cog.before(nodeCircle);*/
    
    var newNode = s.group(nodeCircle, nodeLabel);
    newNode.rays = Snap.set();
    newNode.hover(function () {
        nodeCircle.attr({
            stroke: highlightColor
        });
    },
    function () {
        nodeCircle.attr({
            stroke: "#000"
        });
    });
    newNode.drag();
    newNode.drag(function(e){ // node rays drag with the node
        var draggednode = hoverednode || lasthoverednode;
        var cx = draggednode.getBBox().cx;
        var cy = draggednode.getBBox().cy;
        draggednode.rays.forEach(function(item){
            if (item.src == draggednode) {
                item.attr({
                    x1: cx,
                    y1: cy
                });
            } else {
                item.attr({
                    x2: cx,
                    y2: cy
                });
            }
        });
    },
    function () { // highlight while dragging
        dragging = true;
        pullAheadAll(allnodes, this);
        cancelEdge();
        nodeCircle.attr({
            stroke: highlightColor
        });
    },
    function () {
        dragging = false;
    });
    newNode.mouseover(function () {
        if(!dragging){
            hoverednode = this;
        }
    });
    newNode.mouseout(function () {
        if(!dragging){
            lasthoverednode = hoverednode;
            hoverednode = null;
        }
    });
    allnodes.push(newNode);
    allshapes.push(newNode);
    nodecount += 1;
}

document.onkeydown = function (ev) {
    "use strict";
    var key = (ev || window.event).keyCode;

    // Z press
    if (key === 90) {
        // create a new node
        if (!edgestretchloop && !hoverednode) {
            makeNewNode(mouseX, mouseY, currentcolor);
        }
        // start a new edge
        else if (!edgestretchloop && hoverednode) {
            sourcenode = hoverednode;
            var ln = s.line(hoverednode.getBBox().cx, hoverednode.getBBox().cy, hoverednode.getBBox().cx, hoverednode.getBBox().cy);
            ln.attr({
                stroke: edgeColor,
                strokeWidth: 5
            });
            allshapes.push(ln);
            hoverededge = ln;
            pushBehindAll(allnodes, hoverededge)
            edgestretchloop = setInterval(function () {
                var x2 = ln.getBBox().x2;
                var y2 = ln.getBBox().y2;
                ln.attr({
                    "x2": x2 + (mouseX - x2),
                    "y2": y2 + (mouseY - y2)
                });

            }, 5);
        }
        // place an edge
        else if (edgestretchloop && key === 90 && hoverednode) {
            if (hoverednode == sourcenode) { return; }
            var cx = hoverednode.getBBox().cx;
            var cy = hoverednode.getBBox().cy;
            hoverededge.attr({
                "x2": cx,
                    "y2": cy
            });
            hoverededge.src = sourcenode;
            hoverededge.dst = hoverednode;
            sourcenode.rays.push(hoverededge);
            hoverednode.rays.push(hoverededge);
            clearInterval(edgestretchloop);
            pushBehindAll(allnodes, hoverededge);
            edgestretchloop = null;
            hoverededge = null;
            sourcenode = null;
        }
        return;
    } else if (key === 88) { // X press
        if (edgestretchloop) { // cancel edge
            cancelEdge();
            return;
        } else if (hoverednode) { // remove node
            removeNode(allnodes, hoverednode);
            hoverednode = null;
        }
        return;
    } else if (49 <= key && key <= 54) { // 1-6 press
        if (hoverednode) {
            // modifies color of hovered node rather than changing currentcolor
            hoverednode[0].attr({
                fill: palette[key]
            });
        } else {
            currentcolor = palette[key];
            document.querySelector("#currentcolor").setAttribute("style", "background-color:" + currentcolor);
        }
        return;
    } else if (67 === key) {
        clearShapes(allshapes);
    } else {
        //alert(key);
    }
};
