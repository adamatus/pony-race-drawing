var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var getStepSize = function() {
    return (90*ponies.length*50)/(raceLength*1000);
};

var runPonies = function() {
    if (running) {
        // Figure out which (if any) ponies haven't finished
        var notFinished = [];
        for (var i = 0; i < ponies.length; i++) {
            if (ponies[i].progress < 90) { 
                notFinished.push(i);
            }
        }
         
        // See if any of the ponies still need to finish
        if (notFinished.length > 0) {
            // Move a random (still running) pony forward and record if they
            // made it to the end
            var tmp = getRandomInt(0,notFinished.length-1);
            ponies[notFinished[tmp]].progress += getStepSize();
            if (ponies[notFinished[tmp]].progress >= 90)
            {
                ponies[notFinished[tmp]].finishPos = nextPlace++;
            }

            // Actually move the pony
            d3.selectAll('.pony').data(ponies,function(d) { return d.jockey + d.num; })
                .transition().ease('linear').duration(50)
                .attr('transform',function(d,i) { return 'translate('+x(d.progress)+',0)';})
            setTimeout(runPonies,50);
        } else {
            d3.selectAll('.rank-entry').remove();
            d3.select('#winner-list').selectAll('.rank-entry')
               .data(ponies,function(d) { return d.finishPos; })
              .enter()
                .append('p')
                .classed('rank-entry',true)
                .text(function(d,i) { return d.finishPos + ': ' + d.jockey;}) ;

           d3.selectAll('.rank-entry').sort(function(a,b) { return a.finishPos < b.finishPos ? -1 : 1; }).order(); 
               
           // setTimeout(function() { d3.select('#winner-list').style('display','block'); }, 350);
            $(function() {
                $( "#winner-list" ).dialog({
                  height: 200,
                  modal: true
                });
              });
           
            $("#go-button").text('Done');
            done = true;
            running = false;
        }
    }
};

var addEntrant = function() {
    if (allowChanging) {
        var name = $('#name').val(),
            num = $('#num').val(),
            col = $('select[name="colorpicker"]').val();

        if (name.length > 0 && !isNaN(+num)) {
            // Check to see if a jockey name exists, if so, don't allow it
            // to be reused
            var previouslyUsed = false;
            for (var i=0; i < jockeys.length; i++) {
                previouslyUsed = name == jockeys[i].name ? true : false;
            }
            if (previouslyUsed) {
                window.alert('Sorry, you can not reuse a Jockey')
            } else {

                // Add the individual ponies and the jockey to the list
                for (var i = 0; i < +num; i++) {
                    ponies.push({progress:0,
                            jockey:name,
                            num:i,
                            col:col,
                            finishPos:0});
                }

                // Add the jockey to the jockies list
                jockeys.push({name:name,num:num,col:col});

                updateJockeyLineup();
                updatePonyLineup();
                
                // Remove the color from the color picker 
                for (var i = 0; i < colorList.length; i++) {
                    if (col == colorList[i].value) {
                        colorList[i].active = 0;
                    }
                }
                updatePicker();

                // Clear input boxes and reset the default names
                $('#name').val('Jockey');
                $('#num').val('#');
                formDefaulter.add('name');
                formDefaulter.add('num');
                $('#name').removeClass("edited-input");
                $('#num').removeClass("edited-input");
                $('#name').addClass("default-input");
                $('#num').addClass("default-input");
                $('#name').focus();
            }
        } else {
            window.alert('Please enter a unique jockey name and # of ponies for that jockey!')
        }
    }
};

var removeEntrant = function(i) {
    if (allowChanging) {
        // Figure out which indexes we need to remove
        var toRemove = [];
        for (var j = 0; j < ponies.length; j++) {
            if (ponies[j].jockey == jockeys[i].name) {
                toRemove.push(j);
            }
        }
       

        // Remove them in reverse order so we don't have 
        // to do anything fancy with indexes
        for (var j = toRemove.length-1; j > -1; j--) {
            ponies.splice(toRemove[j],1);
        }

        // Remove jockey's rects and move remaining ponies/fix y-scale 
        updatePonyLineup();
       
        // Add the jockeys color back to picker 
        for (var j = 0; j < colorList.length; j++) {
            if (jockeys[i].col == colorList[j].value) {
                colorList[j].active = 1;
            }
        }
        updatePicker();

        // Remove jockeys name from displayed list list
        jockeys.splice(i,1);
        updateJockeyLineup();
    }
};

var resetPonies = function() {
    // Send the ponies back to the beginning
    for (var i = 0; i < ponies.length; i++) {
        ponies[i].progress = 0;
    }

    done = false;
    running = false;
    nextPlace = 1;

    d3.selectAll('.pony').data(ponies,function(d) { return d.jockey + d.num; })
        .transition().ease('linear').duration(250)
        .attr('transform',function(d,i) { return 'translate('+x(d.progress)+',0)';})

    $("#go-button").text('Go!');

    d3.selectAll('.rank-entry').remove();
};

var randomizePonies = function(which) {
    if (which === "Sorted") {
        // Sort ponies back to jockey order
        neworder = [];
        for (var i=0; i < jockeys.length; i++) {
            for (var j=0; j < ponies.length; j++) {
                if (jockeys[i].name == ponies[j].jockey) {
                    neworder.push(j);
                }
            }
        }
        newponies = []
        for (var j=0; j < ponies.length; j++) {
            newponies.push(ponies[neworder[j]]);
        }
        ponies = newponies;
    } else {
        // Shuffle the ponies, using code from here: http://stackoverflow.com/a/2450976
        var currentIndex = ponies.length
            , temporaryValue
            , randomIndex
            ;

         // While there remain elements to shuffle...
         while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = ponies[currentIndex];
            ponies[currentIndex] = ponies[randomIndex];
            ponies[randomIndex] = temporaryValue;
        }
    }
    updatePonyLineup();
};

var updateJockeyLineup = function() {

    // Select current jockey list
    var jockeyList = d3.select('#jockey-list').selectAll('.jockey')
            .data(jockeys);

    // Remove old jockeys
    jockeyList.exit().remove();
    
    // Update entries for existing jockeys
    jockeyList.select('.jockey-name').attr('value',function(d) { return d.name; })
    jockeyList.select('.jockey-num').attr('value',function(d) { return d.num; })
    jockeyList.select('.jockey-col').style('background-color',function(d) { return d.col; })

    // Add new jockey entries
    var newJockeyList = jockeyList.enter()
            .append('div')
            .classed('jockey',true);

    newJockeyList.append('input')
        .attr('type','text')
        .attr('disabled','disabled')
        .attr('value',function(d) { return d.name; })
        .classed('jockey-name',true);

    newJockeyList.append('input')
        .attr('type','text')
        .attr('disabled','disabled')
        .attr('value',function(d) { return d.num; })
        .classed('jockey-num',true);

    newJockeyList.append('span')
        .text('\u00A0\u00A0\u00A0\u00A0')
        .style('background-color',function(d) { return d.col; })
        .classed('simplecolorpicker',true)
        .classed('icon',true)
        .classed('jockey-col',true);

    newJockeyList.append('span')
        .text('\u2012')
        .classed('jockey-remove',true)
        .on('click',function(d,i) {removeEntrant(i); });

};

// shape: .pony-group .pony rect
// pony:
// bike: .pony-group .pony g 

var updatePonyLineup = function() {
    // Make sure y domain is correct
    y.domain([0,ponies.length+1]);
    
    var ponyGroup = d3.select('#data-region').selectAll('.pony-group')
            .data(ponies,function(d) {return d.jockey + d.num; });

    // Update position for old ponies
    ponyGroup.transition().duration(100)
            .attr('transform',function(d,i) { return 'translate(0,'+y(i)+')';});

    // Add new group for new ponies
    var newPonyGroup = ponyGroup.enter()
        .append('svg:g')
        .attr('transform',function(d,i) { return 'translate(0,'+y(i)+')';})
        .classed('pony-group',true);
    
    // Update positions for existing lanes
    ponyGroup.select('.pony-lane') 
        .transition().duration(100)
            .attr('y',y(1)-Math.min(y(.05)-y(0),height/100)/2)
            .attr('height',Math.min(y(.05)-y(0),height/100))
            .attr('x',x(10))
            .attr('width',x(90)-x(0))
            .style('fill',function(d) { return d.col;});

    // Add new lanes
    newPonyGroup.append('svg:rect')
            .attr('y',y(1)-Math.min(y(.05)-y(0),height/100)/2)
            .attr('height',Math.min(y(.05)-y(0),height/100))
            .attr('x',x(10))
            .attr('width',x(90)-x(0))
            .style('stroke','none')
            .classed('pony-lane',true)
            .style('fill',function(d) { return d.col;});

    // shape: g.pony-group g.pony rect.race-pony
    // pony:
    // bike: g.pony-group g.pony g.race-pony 
    
   
    switch (type)
    {
        case 'shape':
            // Update positions for existing shapes
            ponyGroup.select('.pony').select('.race-pony')
                .transition().duration(100)
                    .attr('y',y(1)-Math.min(y(.5)-y(0),height/10))
                    .attr('height',Math.min(y(.5)-y(0),height/10))
                    .attr('width',x(10)-x(0));

            // Add new pony shapes
            var racePonies = newPonyGroup.append('svg:g')
                    .classed('pony',true);

            racePonies.append('svg:rect')
                    .style('stroke','none')
                    .attr('y',y(1)-Math.min(y(.5)-y(0),height/10))
                    .attr('height',Math.min(y(.5)-y(0),height/10))
                    .attr('width',x(10)-x(0))
                    .style('stroke','none')
                    .classed('race-pony',true)
                    .style('fill',function(d) { return d.col;});
            break;
        case 'bike':
            // Update positions for existing shapes
            ponyGroup.select('.pony').select('.race-pony')
                .transition().duration(100)
                    .attr('transform',function(d,i) { return 'translate('+x(10)+','+y(1)+') scale(.1,.1)'; });

            // Add new pony shapes
            var racePonies = newPonyGroup.append('svg:g')
                    .classed('pony',true);

            var newBikes = racePonies.append('svg:g')
                  .attr('transform',function(d,i) { return 'translate('+x(10)+','+y(1)+') scale(.1,.1)'; })
                    .classed('race-pony',true);

            newBikes.append('use').attr('xlink:href',function(d) { return '#road-bike-'+d.col.split('').splice(1,6).join(''); });
            break;
        case 'pony':
            // Update positions for existing shapes
            ponyGroup.select('.pony').select('.race-pony')
                .transition().duration(100)
                    .attr('transform',function(d,i) { return 'translate('+x(10)+','+y(1)+') scale(.1,.1)'; });

            // Add new pony shapes
            var racePonies = newPonyGroup.append('svg:g')
                    .classed('pony',true);

            var newPonies = racePonies.append('svg:g')
                  .attr('transform',function(d,i) { return 'translate('+x(10)+','+y(1)+') scale(.1,.1)'; })
                    .classed('race-pony',true);

            newPonies.append('use').attr('xlink:href','#race-pony');
            
            break;

    }

    ponyGroup.exit().remove();
};

var expandAdvOptions = function() {
    if (advOptionsHidden) {
        $('#adv-options-expand').css({'display':'block'});
        $('#adv-options-title').text('- Hide Advanced Options');
        advOptionsHidden = false;
    } else {
        $('#adv-options-expand').css({'display':'none'});
        $('#adv-options-title').text('+ Show Advanced Options');
        advOptionsHidden = true;
    }
};

var updateStartDir = function(which) {
    if (which === "Left") {
//        x = d3.scale.linear().range([0, w]).domain([0,xmax]);
        d3.select('#plot').transition().duration(1000).attr('transform','translate('+ml+','+mt+') scale(1,1)');
    } else {
        d3.select('#plot').transition().duration(1000).attr('transform','translate('+(w+ml)+','+mt+') scale(-1,1)');
//        x = d3.scale.linear().range([w, 0]).domain([0,xmax]);
    }

//    d3.select('#data-region').selectAll('.border-line')
//        .transition().duration(1250)
//        .attr('x1',function(d) { return x(d); })
//        .attr('x2',function(d) { return x(d); })
//        .attr('y1',y(0))
//        .attr('y2',y(ponies.length));

//    updatePonyLineup();
}


var processEnter = function(e) {
    if (e.which == 13) {
        addEntrant();
        e.preventDefault();
    }
}

$('input[id=num]').on('keypress',function(e) { return processEnter(e); });
$('input[id=name]').on('keypress',function(e) { return processEnter(e) });

var colorList = [{value:"#1F78B4", name:'Blue', active:1},
                {value:"#33A02C", name:'Green', active:1},
                {value:"#E31A1C", name:'Red', active:1},
                {value:"#FF7F00", name:'Orange', active:1},
                {value:"#6A3D9A", name:'Purple', active:1},
                {value:"#A6CEE3", name:'Light Blue', active:1},
                {value:"#B2DF8A", name:'Light Green', active:1},
                {value:"#FB9A99", name:'Light Red', active:1},
                {value:"#FDBF6F", name:'Light Orange', active:1},
                {value:"#CAB2D6", name:'Light Purple', active:1}];


var updatePicker = function() {
    // Add the color picker
    $('select[name="colorpicker"]').empty();
    var firstCol = '';
    for (var i = 0; i < colorList.length; i++) {
        if (colorList[i].active) {
            if (firstCol == '') {
                firstCol = colorList[i].value;
            }
            var option = $('<option></option')
                    .attr("value",colorList[i].value)
                    .text(colorList[i].name);
            $('select[name="colorpicker"]').append(option);
        }
    }

    $('select[name="colorpicker"]').simplecolorpicker();
    $('select[name="colorpicker"]').simplecolorpicker('selectColor',firstCol);
    $('select[name="colorpicker"]').simplecolorpicker('destroy');
    $('select[name="colorpicker"]').simplecolorpicker({picker: true});
};

updatePicker();

// Have default values in form disappear on focus
// From http://stackoverflow.com/a/12876076
var formDefaulter=function(){
    //Class to hold each form element
    var FormElement=function(element){
        var that=this;
        this.element=element;

        var initialVal=this.element.val();
        var isEdited=false;

        this.element.focus(function(){clearBox()});
        this.element.blur(function(){fillBox()});

        var clearBox=function(){
            if(!isEdited){
                that.element.val("");
                that.element.addClass("edited-input");
                that.element.removeClass("default-input");
                isEdited=true;
            }
        }
        var fillBox=function(){
            if(that.element.val()==""){
                that.element.val(initialVal);
                that.element.removeClass("edited-input");
                that.element.addClass("default-input");
                isEdited=false;
            }
        }
    }

    var add=function(elementId){
        new FormElement($('#'+elementId));
    }

    return{
        add:add
    }
}();

$(function(){
    formDefaulter.add('name');
    formDefaulter.add('num');
});

var updateSpeed = function() {
    raceLength = 21-$('#race-speed').val();
    console.log(raceLength);
}

var ponies = [];
var jockeys = [];
var random = false;

var type = 'bike';
//var type = 'shape';
//var type = 'pony';

var nextPlace = 1;
var raceLength = 10; // Race length in seconds

var running = false;
var done = false;
var allowChanging = true;
var advOptionsHidden = true;

var width = $(window).width()-275;
    height = $(window).height()-150;

var xmax = 110;

var margins = [50, 30, 50, 30], mb = margins[0], ml = margins[1], mt = margins[2], mr = margins[3];
var w = width - (ml + mr),
    h = height - (mb + mt);
var x = d3.scale.linear().range([0, w]).domain([0,xmax]);
var y = d3.scale.linear().range([0, h]).domain([0,1]);

// Add chart SVG
var svg = d3.select('#chart').append('svg:svg')
    .attr('class', 'chart')
    .attr("width", width)
    .attr("height", height);

var defs = svg.append('defs');
var plot = svg.append('g').attr('id','plot').attr('transform','translate('+ml+','+mt+')');
var dataRegion = plot.append('g').attr('id','data-region');

var runButtonClick = function() {
        // Only run ponies if there is at least one to run!
        if (ponies.length > 0)
        {
            if (!running && !done) {
                running = true;
                $("#go-button").text('Pause');
                $("#name").prop('disabled', true);
                $("#num").prop('disabled', true);
                allowChanging = false;
                runPonies();
            } else if (!done) {
                running = false;
                $("#go-button").text('Go!');
            }
        } else {
            window.alert('You have to have at least one jockey racing!')
        }
}

// Deal with 'Reset' button clicks
var resetButtonClick = function() {
    $("#name").prop('disabled', false);
    $("#num").prop('disabled', false);
    allowChanging = true;
    resetPonies();
};


// Add the start and finish lines
d3.select('#data-region').selectAll('.border-line')
        .data([10, 100],function(d) { return d; })
    .enter()
        .append('svg:line')
        .classed('border-line',true)
        .attr('x1',function(d) { return x(d); })
        .attr('x2',function(d) { return x(d); })
        .attr('y1',y(0))
        .attr('y2',y(1))
        .style('stroke','black')
        .style('stroke-dasharray','10,10');

$(window).resize(function() {
    // Add in limits at which points we don't get smaller than
    width = $(window).width()-275;
    height = $(window).height()-150;

    w = width - (ml + mr);
    h = height - (mb + mt);
    x = d3.scale.linear().range([0, w]).domain([0,xmax]);
    y = d3.scale.linear().range([0, h]).domain([0,ponies.length > 0 ?
        ponies.length : 1]);

    d3.select('#chart').select('svg.chart')
        .attr("width", width)
        .attr("height", height);

    d3.select('#data-region').selectAll('.border-line')
        .attr('x1',function(d) { return x(d); })
        .attr('x2',function(d) { return x(d); })
        .attr('y1',y(0))
        .attr('y2',y(ponies.length > 0 ? ponies.length : 1));

    updatePonyLineup();
});

$("#race-dir-toggle").toggleSwitch({
            highlight: false,
            change: function(e) {
                if (ponies.length > 0) {
                    updateStartDir($('#race-dir-toggle').val());
                }
              },
        });

$("#randomize-toggle").toggleSwitch({
            highlight:false,
            change: function(e) {
                if (ponies.length > 0) {
                    randomizePonies($('#randomize-toggle').val());
                }
              },
        });

var bike = '';

clCount = 0;
// Create a differently colored version of each icon to be used
// FIXME Maybe we should only create the icons when the jockey is added?
//   This prevents us from having a bunch of unused refs in the svg
for (var i=0; i < colorList.length; i++) {
    d3.xml("icons/road.svg", "image/svg+xml", function(xml) {  
      var j = clCount++;
      var importedNode = document.importNode(xml.documentElement, true);
      defs.append("g")
                .attr('id','road-bike-'+colorList[j].value.split('').splice(1,6).join(''))
                .attr('transform','translate(-551,-312)')
            .each(function(d, i){ 
                var bike = this.appendChild(importedNode.cloneNode(true)); 
                d3.select(bike).selectAll('#frame path')
                   .style('fill',colorList[j].value)
                   .style('stroke',colorList[j].value);
            });
    });
}

d3.xml("icons/pony.svg", "image/svg+xml", function(xml) {  
  var importedNode = document.importNode(xml.documentElement, true);
  defs.append("g")
            .attr('id','race-pony')
            .attr('transform','translate(-605,-471)')
        .each(function(d, i){ 
            var pony = this.appendChild(importedNode.cloneNode(true)); 
        });
});