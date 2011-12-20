/*
Copyright (c) 2011 Mark Hepburn, http://everythingtastesbetterwithchilli.com/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Use the <canvas> element to place vertical text inside an element.  Requires
// the excanvas script (http://code.google.com/p/explorercanvas/) if used on IE,
// but should otherwise be quite portable.

// Can be invoked with a dictionary of options (see 'defaults' below for options),
// or a string which will be used as the text for all matched elements, or an array
// which will be treated as multi-line text.

(function($) {
var fontprops = ['font-style', 'font-variant', 'font-weight', 'font-size', 'font-family'];

$.fn.verticalText = function(textOrUserOptions) {
  var defaults = {
    bottomOffset: 5, // Pixels from the bottom that the first character is offset.
    lineSep: 5,      // Pixels between lines (if multi-line is in use, otherwise ignored).
    centered: false, // Centre text instead of a constant offset from the bottom.
                     // Overrides bottomOffset if set to true.
    text: 'Text',    // Can be text (used in all matching elements), or a function
                     // taking the index and element, or an array of text (which will be
                     // treated as multi-line text).
    font: null       // A CSS-like font string.  Uses the style of the selected
                     // element if not supplied.
  };

  var textFunction;
  if (typeof textOrUserOptions == 'string' || $.isArray(textOrUserOptions)) {
      textFunction = function(i, el) {
        return textOrUserOptions;
      };
  }
  else {
    $.extend(defaults, textOrUserOptions);

    if ($.isFunction(defaults.text)){
      textFunction = defaults.text;
    }
    else {
      textFunction = function(i, el) {
        return defaults.text;
      };
    }
  }

  this.each(function(i, container) {
    container = $(container);
    var text = textFunction(i, container);
    var width = container.width(),
        height = container.height();
    var canvas = document.createElement('canvas');
    container.append(canvas);
    // IE support; if the canvas element is dynamically created, the getContext
    // method won't be available until it is explicitly intialised:
    if (typeof G_vmlCanvasManager != 'undefined' && G_vmlCanvasManager && G_vmlCanvasManager.initElement) {
      canvas = G_vmlCanvasManager.initElement(canvas);
    }
    canvas.width = width;
    canvas.height = height;
    $(canvas).css({
      width: width,
      height: height
    });
    var context = canvas.getContext('2d');

    var font = defaults.font;
    if (!font) {
      // if no font has been specified, construct a string from the computed properties of the container:
      font = $.map(fontprops, function(prop) { return container.css(prop); }).join(' ');
    }

    var textArray = $.isArray(text) ? text : [text],
        t, numLines = textArray.length,
        textHeight, textWidth, fontColour,
        totalTextHeights = 0, textDims = [];

    for (t = 0; t < numLines; t++) {
      text = textArray[t];
      // get the dimensions of the text using a temporary div, attached (invisibly)
      // to the parent container to inherit desired styles:
      var tmp = $('<span></span>');
      tmp.text(text);
      // reset sizing attributes, then explicitly set font properties from the
      // container to calculate text metrics (everything else is inherited, but
      // we don't want to inadvertently receive styling via CSS that messes up
      // the calculations, such as the temporary element matching a selector
      // that sets width):
      tmp.css({
        position: 'absolute',
        left: -1000,
        top: -1000,
        border: '0',
        padding: '0',
        margin: '0',
        display: 'inline',
        width: 'auto',
        height: 'auto'
      });
      $.each(fontprops, function(i, prop) { tmp.css(prop, container.css(prop)); });
      container.append(tmp);
      textWidth = tmp.outerWidth(); textHeight = tmp.outerHeight(); fontColour = tmp.css('color');
      tmp.remove();

      totalTextHeights += textHeight;
      textDims.push({
          width: textWidth,
          height: textHeight
      });
    }
    totalTextHeights += (numLines-1) * defaults.lineSep;

    var translateX, translateY;

    // Set up coordinate system so we can start from the origin (first
    // move to a slight offset from the opposite corner, then rotate back
    // 90 degrees):
    translateX = (width + totalTextHeights) / 2;
    translateY = height - defaults.bottomOffset;
    context.translate(translateX, translateY);
    context.rotate(-Math.PI/2);

    // Note that an alternative strategy is to set the text baseline
    // to 'middle' and translate width/2 across (which avoids having to
    // calculate the text metrics at all if centering is not used), but
    // for some reason the current strategy gives better results (and is
    // easier to reason about with multi-line text).
    context.font = font;
	context.fillStyle = fontColour;
    context.textBaseline = 'bottom';

    // Draw each line of text, starting from the bottom (last line):
    translateX = translateY = 0;
    for (t = numLines; t--; ) {
      text = textArray[t];
      textWidth = textDims[t].width; textHeight = textDims[t].height;

      if (defaults.centered) {
        translateX = (height - textWidth) / 2 - defaults.bottomOffset;
      }

      context.fillText(text, translateX, translateY);

      // Get ready for the next line (which is the previous one, appearing above it):
      translateY -= textHeight + defaults.lineSep;
    }
  });

  return this;
};
})(jQuery);
