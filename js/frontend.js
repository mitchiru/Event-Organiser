if ( typeof EO_SCRIPT_DEBUG === 'undefined') { EO_SCRIPT_DEBUG = true;}

var eventorganiser = eventorganiser || {};

(function ($) {
jQuery(document).ready(function () {

	/* Fullcalendar */
	function eventorganiser_filter_markup( options ){
		
		//Are we whitelisting categories 
		var whitelist = ( typeof options.whitelist !== "undefined" && options.whitelist ? options.whitelist.split(',') : false );   
		
		var html="<select class='eo-fc-filter eo-fc-filter-"+options.type+"' data-filter-type='"+options.type+"'>";
		html+="<option value=''>"+options.select_none+"</option>";
		
		var term;
		for ( var term_id in options.terms ){
			
			term = options.terms[term_id];
			
			//If whitelist check term (or ancestor of) belongs to white list.
			if( whitelist ){
				var include_in_dropdown = false;
				
				if( $.inArray( term.slug, whitelist ) !== -1 ){
					include_in_dropdown = true;
				}
				
				//Check ancestors
				var parent = term;
				while( !include_in_dropdown && parent.parent > 0 ){
					parent = terms[parent.parent];
					if( $.inArray( parent.slug, whitelist ) !== -1 ){
						include_in_dropdown = true;
					}
				}
				
				if( !include_in_dropdown ){
					continue;
				}
			}
			
			html+= "<option value='"+term.slug+"'>"+term.name+"</option>";
		}
		html+="</select>";

		var element = $("<span class='fc-header-dropdown filter-'"+options.type+"></span>");
		element.append(html);
		return element;	
	}
	
	$(".eo-fullcalendar").on( 'change', '.eo-fc-filter', function () {
		$(".eo-fullcalendar").fullCalendar( 'rerenderEvents' );
	});
	
	function eventorganiser_mini_calendar(){
		var element = $("<span class='fc-header-goto'><input type='hidden' class='eo-mini-calendar'/></span>");
		return element;
	}
	
	$('.eo-mini-calendar').datepicker({
		dateFormat: 'DD, d MM, yy',
		changeMonth: true,
		changeYear: true,
		firstDay: parseInt( eventorganiser.fullcal.firstDay, 10 ),
		buttonText: EOAjaxFront.locale.gotodate,
		monthNamesShort: EOAjaxFront.locale.monthAbbrev,
		dayNamesMin: EOAjaxFront.locale.dayAbbrev,
		nextText: EOAjaxFront.locale.nextText,
		prevText: EOAjaxFront.locale.prevText,
		showOn: 'button',
		beforeShow: function(input, inst) {
			if( inst.hasOwnProperty( 'dpDiv' ) ){
				inst.dpDiv.addClass('eo-datepicker eo-fc-datepicker');
			}else{
				$('#ui-datepicker-div').addClass('eo-datepicker eo-fc-datepicker');
			}
		},
		onSelect: function (dateText, dp) {
			var cal_id = $(this).parents('div.eo-fullcalendar').attr('id');
			$('#'+cal_id).fullCalendar('gotoDate', new Date(Date.parse(dateText)));
        		}
    });
		
	if ($(".eo-fullcalendar").length > 0) {
		var loadingTimeOut;
		var calendars = eventorganiser.calendars;
		for (var i = 0; i < calendars.length; i++) {
			var calendar = "#eo_fullcalendar_" + (i + 1);
			if (typeof calendars[i].category === "undefined") {
				calendars[i].category ='';
			}
			if (typeof calendars[i].venue === "undefined") {
				calendars[i].venue ='';
			}
			
			var args = {
					
				id: calendar,
				
				year: calendars[i].year ? calendars[i].year : undefined,
				month: calendars[i].month ? calendars[i].month : undefined,
				date: calendars[i].date ? calendars[i].date : undefined,
				
				category: calendars[i].event_category,
				venue: calendars[i].event_venue,
				
				customButtons:{
					category: function(){
						return eventorganiser_filter_markup( {
							terms: eventorganiser.fullcal.categories,
							select_none: EOAjaxFront.locale.cat,
							whitelist: calendars[i].event_category,
							type: 'category'
						})
					},
					venue: function(){
						return eventorganiser_filter_markup( {
							terms: eventorganiser.fullcal.venues,
							select_none: EOAjaxFront.locale.venue,
							whitelist: calendars[i].event_venue,
							type: 'venue'
						})
					},
					tag: function(){
						return eventorganiser_filter_markup( {
							terms: eventorganiser.fullcal.tags,
							select_none: EOAjaxFront.locale.tag,
							whitelist: '',
							type: 'tag'
						})
					},
					'goto': 	eventorganiser_mini_calendar
				},
				
				theme: calendars[i].theme,
				isRTL: calendars[i].isrtl,
				editable: false,
				selectable: false,
            	weekMode: "variable",
				tooltip: calendars[i].tooltip,
				firstDay: parseInt( eventorganiser.fullcal.firstDay, 10 ),
				weekends: calendars[i].weekends,
				allDaySlot: calendars[i].alldayslot,
				allDayText: calendars[i].alldaytext,
				axisFormat: calendars[i].axisformat,
				minTime: calendars[i].mintime,
				maxTime:calendars[i].maxtime,
				eventColor: "#1e8cbe",
				
				timeFormatphp: calendars[i].timeformatphp,
				timeFormat: calendars[i].timeformat,
				columnFormat: {
					month: calendars[i].columnformatmonth,
					week: calendars[i].columnformatweek,
					day: calendars[i].columnformatday
				},
				titleFormat: {
					month: calendars[i].titleformatmonth,
					week: calendars[i].titleformatweek,
					day: calendars[i].titleformatday
				},
				
				header: {
					left: calendars[i].headerleft,
					center: calendars[i].headercenter,
					right: calendars[i].headerright
				},
				
				eventRender: function ( event, element, view ) {
						
					var category = $(view.calendar.options.id).find(".eo-fc-filter-category").val();
					var venue    = $(view.calendar.options.id).find(".eo-fc-filter-venue").val();
					var tag      = $(view.calendar.options.id).find(".eo-fc-filter-tag").val();
					
					if (typeof category !== "undefined" && category !== "" && $.inArray( category, event.category) < 0 ) {
						return "<div></div>";
					}
					if (typeof venue != "undefined" && venue !== "" && venue != event.venue) {
						return "<div></div>";
					}
                        
					if (typeof tag !== "undefined" && tag !== "" && $.inArray(tag, event.tags) < 0 ) {
						return "<div></div>";
					}
                        
					if( !wp.hooks.applyFilters( 'eventorganiser.fullcalendar_render_event', true, event, element, view ) ){
						return "<div></div>";
					}
                        	
					if ( !view.calendar.options.tooltip ) {
						return;
					}

					$(element).qtip({
						content: {
							text:  event.description,
                        	button: false,
                        	title: event.title
                        },
                        position: {
                        	my: "top center",
                        	at: "bottom center",
                        	viewport: $(window),
                        	adjust: {
                        		method: 'shift none'
                        	}
                        },
                        hide: {
                        	fixed: true,
                        	delay: 500,
                        	effect: function (a) {$(this).fadeOut("50");}
                        },
                        border: {
                        	radius: 4,
                        	width: 3
                        },
                        style: {
                        	classes: "eo-event-toolip qtip-eo",
                        	///widget: true,
                        	tip: "topMiddle"
                        }
					});
				},
				
				buttonText: {
                    today: 	EOAjaxFront.locale.today,
                    month: 	EOAjaxFront.locale.month,
                	week: 	EOAjaxFront.locale.week,
                	day: 	EOAjaxFront.locale.day
				},
				monthNames: EOAjaxFront.locale.monthNames,
				monthNamesShort: EOAjaxFront.locale.monthAbbrev,
				dayNames: EOAjaxFront.locale.dayNames,
				dayNamesShort: EOAjaxFront.locale.dayAbbrev,
                	
                responsive: calendars[i].responsive,
                defaultView: ( $(window).width() < 514 && calendars[i].responsive )  ? 'listMonth' : calendars[i].defaultview,
                windowResize: function(view) {
                	if( view.calendar.options.responsive && $(window).width() < 514 ){
                		$(this).fullCalendar( 'changeView', 'listMonth' );
                	} else {
                		$(this).fullCalendar( 'changeView', view.calendar.options.defaultView );
                	}
                },
                	
                lazyFetching: "true",
                events: 
                	function (start, end, timezone, callback) {
                		var options = this.options;
                		var request = {
                				start: start.format( "YYYY-MM-DD" ),
                				end: end.format( "YYYY-MM-DD" ),
                				timeformat: options.timeFormatphp,
                				users_events: 0,
                		};
                			
                		if (typeof options.category !== "undefined" && options.category !== "") {
                			request.category = options.category;
                		}
                		if (typeof options.venue !== "undefined" && options.venue !== "") {
                			request.venue = options.venue;
                		}
                			
                		request = wp.hooks.applyFilters( 'eventorganiser.fullcalendar_request', request, start, end, timezone, options );
                			
                		$.ajax({
                			url: eventorganiser.ajaxurl + "?action=eventorganiser-fullcal",
                			dataType: "JSON",
                			data: request,
                			complete: function( r, status ){
                				if ( EO_SCRIPT_DEBUG ) {
                					if( status == "error" ){
                						 
                					}else if( status == "parsererror" ){
                						if( window.console ){
                							console.log( "Response is not valid JSON. This is usually caused by error notices from WordPress or other plug-ins" ); 
                							console.log( "Response reads: " + r.responseText );
                						}
                  						alert( "An error has occurred in parsing the response. Please inspect console log for details" );
                					} 
                				}
                			},
                			success: callback,
                		});
                	},
                	
                	loading: function ( is_loading ) {
                		var loading = $("#" + $(this).attr("id") + "_loading");
                		if ( is_loading ) {
                			window.clearTimeout(loadingTimeOut);
                			loadingTimeOut = window.setTimeout(function () {loading.show();}, 1e3);
                		} else {
                			window.clearTimeout(loadingTimeOut);
                			loading.hide();
                		}
                	},
            	};
            	args = wp.hooks.applyFilters( 'eventorganiser.fullcalendar_options', args, calendars[i] );
            	
            	$(calendar).fullCalendar(args);
			}
	}

	/* Upcoming dates */
	if( $('#eo-upcoming-dates').length>0 && $('#eo-upcoming-dates').find('li:gt(4)').length > 0 ){
		var eobloc = 5;
		var locale = { more : EOAjaxFront.locale.ShowMore, less : EOAjaxFront.locale.ShowLess};
		$('#eo-upcoming-dates').find('li:gt('+(eobloc-1)+')').hide().end().after(
	    		$('<a href="#" id="eo-upcoming-dates-less">'+locale.less+'</a> <span id="eo-upcoming-dates-pipe">|</span> <a href="#" id="eo-upcoming-dates-more">'+locale.more+'</a>')
		);
		$('#eo-upcoming-dates-pipe').hide();
		$('#eo-upcoming-dates-less').hide().click(function(e){
			e.preventDefault();
			var index = Math.floor( ($('#eo-upcoming-dates li:visible').length -1) / eobloc)*eobloc -1;
			$('#eo-upcoming-dates li:gt('+index+')').hide();
			$('#eo-upcoming-dates-more,#eo-upcoming-dates-pipe').show();
			if( $('#eo-upcoming-dates li:visible').length <= eobloc ){
					$('#eo-upcoming-dates-less,#eo-upcoming-dates-pipe').hide();
			}
		});
		$('#eo-upcoming-dates-more').click(function(e){
			e.preventDefault();
			$('#eo-upcoming-dates-less,#eo-upcoming-dates-pipe, #eo-upcoming-dates li:hidden:lt('+eobloc+')').show();
			var offset = $('#eo-upcoming-dates-pipe').offset();
			$('html, body').animate({
				scrollTop: Math.max( offset.top + 40 - $(window).height(),$(window).scrollTop())
			});
			if( $('#eo-upcoming-dates li:hidden').length === 0 ){
				$('#eo-upcoming-dates-more,#eo-upcoming-dates-pipe').hide();
			}
		});
	}
	
        if ($(".eo-widget-cal-wrap").length > 0 ) {

        	$(".eo-widget-cal-wrap").on("click", 'tfoot a', function (a) {
        		a.preventDefault();
        		
        		var calID = $(this).closest(".eo-widget-cal-wrap").data("eo-widget-cal-id");
        		
        		//Defaults
        		var cal = {showpastevents: 1, 'show-long': 0, 'link-to-single': 0 };

        		//Shortcode widget calendar
        		if( typeof eventorganiser.widget_calendars !== "undefined" && typeof eventorganiser.widget_calendars[calID] !== "undefined" ){
        			cal = eventorganiser.widget_calendars[calID];	
        		}
        		//Widget calendar
        		if( typeof eo_widget_cal !== "undefined" && typeof eo_widget_cal[calID] !== "undefined" ){
        			cal = eo_widget_cal[calID];
                }

                //Set month
                cal.eo_month = eveorg_getParameterByName("eo_month", $(this).attr("href"));

                $.getJSON(EOAjaxFront.adminajax + "?action=eo_widget_cal", cal,function (a) {$("#" + calID + "_content").html(a);});
        	});
        }

});

    	eventorganiser.template = function( text, data, settings ){

    		var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
    		
    		settings = typeof settings !== 'undefined' ? settings : {};
    				
    		settings = $.extend( true, {
				evaluate    : /<%([\s\S]+?)%>/g,
				interpolate : /<%=([\s\S]+?)%>/g,
				escape      : /<%-([\s\S]+?)%>/g
    		}, settings );
    		
    		var escapes = {
    				"'":      "'",
    				'\\':     '\\',
    				'\r':     'r',
    				'\n':     'n',
    				'\t':     't',
    				'\u2028': 'u2028',
    				'\u2029': 'u2029'
    		};
    		
    		var render;

    		//Combine delimiters into one regular expression via alternation.
    		var matcher = new RegExp([
                  (settings.escape ).source,
                  (settings.interpolate ).source,
                  (settings.evaluate ).source
                  ].join('|') + '|$', 'g');
    		
    		//Compile the template source, escaping string literals appropriately.
    		var index = 0;
    		var source = "__p+='";
    		text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
    			source += text.slice(index, offset).replace(escaper, function(match) { return '\\' + escapes[match]; });

    			if (escape) {
    				source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
    			}
    			if (interpolate) {
    				source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
    			}
    			if (evaluate) {
    				source += "';\n" + evaluate + "\n__p+='";
    			}
    			index = offset + match.length;
    			return match;
    		});
    		source += "';\n";

    		//If a variable is not specified, place data values in local scope.
    		if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
    		 
    		source = "var __t,__p='',__j=Array.prototype.join," +
    			"print=function(){__p+=__j.call(arguments,'');};\n" +
    			source + "return __p;\n";

    		try {
    			render = new Function(settings.variable || 'obj', '_', source);
    		} catch (e) {
    			e.source = source;
    			throw e;
    		}

    		if ( data ) return render( data );

    		var template = function( data ) {
    			return render.call( this, data );
    		};
    		
    		return template;
    	};

    	eventorganiser.agenda_widget = function( param ){ 
    		this.param = param;
    		this.start = moment();
    		this.end   = moment();
    		this.$el   = $( '#' + this.param.id + '_container' );
    		this.direction = 1;
    		
    		this.eventTemplate = eventorganiser.template( $('#eo-tmpl-agenda-widget-item').html(), null, {variable: 'event'} );
    		this.groupTemplate = eventorganiser.template( $('#eo-tmpl-agenda-widget-group').html(), null, {variable: 'group'} );
    	};
    	
    	eventorganiser.agenda_widget.prototype.group_change = function( previous, current ){
    		
    		if( previous == false ){
    			return true;
    		}
    		
    		if( this.param.mode !== 'day' ){
    			return false;
    		}
    		
    		return previous.format( 'YYYY-MM-DD' ) !== current.format( 'YYYY-MM-DD' );
    	};
    	
    	eventorganiser.agenda_widget.prototype.init = function(){
    		
    		this.$el.html( eventorganiser.template( $('#eo-tmpl-agenda-widget').html(), {}, {variable: 'data'} ) );
    		this.$datesEl = this.$el.find( '.dates' );
    		this.load_events();
    		
    		//Actions 
    		if( this.param.add_to_google ){
    			this.$el.on( "click", '.event', function(){
    				$(this).find(".meta").toggle("400");
    			});
    		}
    		
    		var self = this;
			this.$el.on( "click", '.eo-agenda-widget-nav-prev,.eo-agenda-widget-nav-next', function(){
				if( $(this).hasClass( 'eo-agenda-widget-nav-prev' ) ){
					self.direction = -1;
				}else{
					self.direction = 1;
				}
				self.load_events();
			});
    		    
    	};

    	eventorganiser.agenda_widget.prototype.load_events = function(){
    		var self = this;
            $.ajax({
                url: EOAjaxFront.adminajax,
                dataType: "JSON",
                data: {
                    action: "eo_widget_agenda",
                    instance_number: this.param.number,
                    direction: this.direction,
                    start: this.start.format("YYYY-MM-DD"),
                    end: this.end.format("YYYY-MM-DD")
                },
                success: function( events ) {
                	var numberEvents = events.length;
            		for( var i=0; i< numberEvents; i++ ){
            			events[i].start = moment( events[i].start );
            			events[i].end = moment( events[i].end );
            		}
            		self.start = events[0].start;
            		self.end = events[numberEvents-1].start;
            		self.insert_events( events );
                }
            });
    	};
    	
    	eventorganiser.agenda_widget.prototype.insert_events = function( events ){
    		this.$datesEl.html( "" );
    		
    		var numberEvents = events.length;
    		var previous = false, $group = false, $events = false;
    		
    		for( var i=0; i< numberEvents; i++ ){
    		
    			if( this.group_change( previous, events[i].start ) ){
    				this.$datesEl.append( $group );
    				var group = { 
    					start: events[i].start,
    				};
    				$group = $( this.groupTemplate( group ) );
    				$events = $group.find( '.a-date' );
    			}
    			
    			$events.append( this.eventTemplate( events[i] ) );
    			
    			previous = events[i].start;
    		}
    		
    		this.$datesEl.append( $group );
    	};
    	
    	jQuery(document).ready(function($){
    		if( $('.eo-agenda-widget').length > 0 ) {
    			for (var agenda in eo_widget_agenda) {
    				agendaWidget = new eventorganiser.agenda_widget( eo_widget_agenda[agenda] );
    				agendaWidget.init();
    			}
    		}
    	});
    	
})(jQuery);


function eveorg_getParameterByName(a, b) {
    a = a.replace(/[\[]/, "\\[")
        .replace(/[\]]/, "\\]");
    var c = "[\\?&]" + a + "=([^&#]*)";
    var d = new RegExp(c);
    var e = d.exec(b);
    if (e === null) return "";
    else return decodeURIComponent(e[1].replace(/\+/g, " "));
}

function eo_load_map() {
	var maps = eventorganiser.map;
	
	for (var i = 0; i < maps.length; i++) {
		
		if ( null === document.getElementById( "eo_venue_map-" + (i + 1) ) )
		    continue;
		
		//Store markers
		eventorganiser.map[i].markers = {};
		var locations = maps[i].locations;
		var b = {
            zoom: maps[i].zoom,
			scrollwheel: maps[i].scrollwheel,
			zoomControl: maps[i].zoomcontrol,
			rotateControl: maps[i].rotatecontrol,
			panControl: maps[i].pancontrol,
			overviewMapControl: maps[i].overviewmapcontrol,
			streetViewControl: maps[i].streetviewcontrol,
			draggable: maps[i].draggable,
			mapTypeControl: maps[i].maptypecontrol,
			mapTypeId: google.maps.MapTypeId[maps[i].maptypeid],
			styles: maps[i].styles,
        	};
		
		b = wp.hooks.applyFilters( 'eventorganiser.google_map_options', b, maps[i] );
		var map = new google.maps.Map(document.getElementById("eo_venue_map-" + (i + 1)), b);

		//  Create a new viewpoint bound
		var bounds = new google.maps.LatLngBounds();

		var LatLngList = [];
		for( var j=0; j<locations.length; j++){
			var lat = locations[j].lat;
        		var lng = locations[j].lng;
        		if (lat !== undefined && lng !== undefined) {
				LatLngList.push(new google.maps.LatLng(lat, lng));
			  	bounds.extend (LatLngList[j]);
			  	
			  	var marker_options = {
			  		venue_id: locations[j].venue_id,
			  		position: LatLngList[j],
			  		map: map,
			  		content:locations[j].tooltipContent,
			  		icon: locations[j].icon
	            };
			  	
			  	marker_options = wp.hooks.applyFilters( 'eventorganiser.venue_marker_options', marker_options );
				var c = new google.maps.Marker(marker_options);				
				eventorganiser.map[i].markers[locations[j].venue_id] = c;

				if( maps[i].tooltip ){
					google.maps.event.addListener(c, 'click',eventorganiser_venue_tooltip);
				}
        	}
		}

   		if( locations.length > 1 ){	
			//  Fit these bounds to the map
			map.fitBounds (bounds);
			//google.maps.event.addListenerOnce(map, 'zoom_changed', function() {map.setZoom(zoom);});
		}else{
			map.setCenter ( LatLngList[0]);
		}

	}//Foreach map
}
/**
* @constructor
*/
function eventorganiser_venue_tooltip() {

	// Grab marker position: convert world point into pixel point
	var map = this.getMap();
	var pixel = this.getMap().getProjection().fromLatLngToPoint(this.position);
	var topRight=map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast()); 
	var bottomLeft=map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest()); 
    var scale=Math.pow(2,map.getZoom()); 
	pixel=  new google.maps.Point((pixel.x- bottomLeft.x)*scale,(pixel.y-topRight.y)*scale);

	wp.hooks.doAction( 'eventorganiser.venue_marker_clicked', this );
	
	//var pixel = LatLngToPixel.fromLatLngToContainerPixel(this.position);
	var pos = [ pixel.x, pixel.y ];

	if(this.tooltip){
		this.tooltip.qtip('api').set('position.target', pos);
		this.tooltip.qtip('show');
		return;
	}
	jQuery(this.getMap().getDiv()).css({overflow: 'visible'});

	// Create the tooltip on a dummy div and store it on the marker
	 this.tooltip =jQuery('<div />').qtip({
        	content: {
			text: this.content
		},
		border: {
			radius: 4,
			width: 3
		},
		style: {
			classes: "qtip-eo ui-tooltip-shadow",
			widget: true
		},
        	position: {
        	    at: "right center",
        	    my: "top center",
        	    target: pos,
        	    container: jQuery(this.getMap().getDiv())
        	},
        	show: {
        	    ready: true,
        	    event: false,
        	    solo: true
        	},
        	hide: {
        	   event: 'mouseleave unfocus'
        	}
	    });
  }
