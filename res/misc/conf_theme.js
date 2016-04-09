// You have to restart QPad for changes to take effect
if(UI.Platform.ARCH=="mac"){
	UI.font_name="LucidaGrande,res/fonts/opensans.ttf"
	UI.eng_font_name="res/fonts/opensans.ttf,!"
}else{
	UI.font_name="res/fonts/opensans.ttf"
	UI.eng_font_name="res/fonts/opensans.ttf,!"
}

UI.Theme_Minimalistic(UI.Platform.BUILD=="debug"?0xff1c1ae3:0xffb4771f);
//UI.Theme_Minimalistic(0xffb4771f);
UI.CustomTheme=function(){
	var L=UI.TestOption("use_light_theme");
	if(L){//light
		var C=UI.current_theme_color;
		var C_dark=UI.lerp_rgba(C,0xff000000,0.15)
		var C_sel=UI.lerp_rgba(C,0xffffffff,0.66)
		var C_raw=C;
	}else{
		var C=UI.lerp_rgba(UI.current_theme_color,0xff000000,0.25);
		var C_dark=UI.lerp_rgba(C,0xff000000,0.15)
		var C_sel=UI.lerp_rgba(C,0xff444444,0.66)
		var C_raw=UI.current_theme_color
	}
	//var C_shadow=(UI.TestOption('enable_srgb')?(L?0x7f000000:0xaa000000):(L?0x55000000:0x7f000000));
	var C_shadow=0xaa000000;
	var C_shadow_dark_aware=(L?0x7f000000:0xaa000000);
	var styles={//light
		tooltip:{
			font:UI.Font(UI.font_name,24,-50),
			padding:8,
			spacing:8,
			color:L?0xffffffff:0xff444444,
			round:8,
			border_color:0xff000000,
			border_width:1,
			text_color:L?0xff000000:0xffe8e8e8,
			shadow_size:6,
			shadow_color:C_shadow,
			triangle_font:UI.Font(UI.icon_font_name,16,0),
			triangle_font2:UI.Font(UI.icon_font_name,16,500),
		},
		button:{
			transition_dt:0.1,
			round:0.1,border_width:1,padding:0,
			font:UI.Font(UI.font_name,20,-50),
			icon_font:UI.Font(UI.icon_font_name,18),
			$:(L?{//light
				out:{
					border_color:0xff444444,color:[{x:0,y:0,color:0xffffffff},{x:0,y:1,color:0xffe8e8e8}],
					icon_color:0xff000000,
					text_color:0xff000000,
				},
				over:{
					border_color:C,color:C,
					icon_color:0xffffffff,
					text_color:0xffffffff,
				},
				down:{
					border_color:C_dark,color:C_dark,
					icon_color:0xffffffff,
					text_color:0xffffffff,
				},
			}:{//dark
				out:{
					border_color:0xff000000,color:[{x:0,y:0,color:0xff666666},{x:0,y:1,color:0xff444444}],
					icon_color:0xffe8e8e8,
					text_color:0xffe8e8e8,
				},
				over:{
					border_color:C,color:C,
					icon_color:0xffe8e8e8,
					text_color:0xffe8e8e8,
				},
				down:{
					border_color:C_dark,color:C_dark,
					icon_color:0xffe8e8e8,
					text_color:0xffe8e8e8,
				},
			}),
		},
		check_button:{
			transition_dt:0.1,
			round:0,border_width:2,padding:12,
			icon_color:L?0xff444444:0xffffffff,
			text_color:L?0xff444444:0xffffffff,
			$:(L?{//light
				out:{
					border_color:C&0x00ffffff,color:0x00ffffff,
				},
				over:{
					border_color:C,color:0x00ffffff,
				},
				down:{
					border_color:C_dark,color:0x00ffffff,
				},
				////////////////////
				checked_out:{
					border_color:C&0x00ffffff,color:C_sel,
				},
				checked_over:{
					border_color:C,color:C_sel,
				},
				checked_down:{
					border_color:C_dark,color:C_sel,
				},
			}:{//dark
				out:{
					border_color:0x00e8e8e8,color:C&0x00ffffff,
				},
				over:{
					border_color:0xffe8e8e8,color:C&0x00ffffff,
				},
				down:{
					border_color:0xffcccccc,color:C&0x00ffffff,
				},
				////////////////////
				checked_out:{
					border_color:0x00e8e8e8,color:C_raw,
				},
				checked_over:{
					border_color:0xffe8e8e8,color:C_raw,
				},
				checked_down:{
					border_color:0xffcccccc,color:C_raw,
				},
			})
		},
		tab_label:{
			transition_dt:0.1,
			shadow_size:8,
			hotkey_font:UI.Font(UI.font_name,12,0),
			font:UI.Font(UI.font_name,24,-50), padding:16,
			button_style:{
				transition_dt:0.1,
				round:0,
				font:UI.Font(UI.icon_font_name,12),border_width:0,padding:0,
				border_color:0,color:0,
			},
			$:(L?{//light
				active:{
					text_color:0xffffffff,
					color:C,
					shadow_color:C_shadow,
				},
				rendered:{
					text_color:0xffffffff,
					color:0xff7f7f7f,
					shadow_color:0x00000000, 
				},
				inactive:{
					text_color:0xff000000,
					color:C&0x00ffffff,
					shadow_color:0x00000000, 
				},
			}:{//dark
				active:{
					text_color:0xffe8e8e8,
					color:C,
					shadow_color:C_shadow,
				},
				rendered:{
					text_color:0xffe8e8e8,
					color:0xff666666,
					shadow_color:0x00000000, 
				},
				inactive:{
					text_color:0xffe8e8e8,
					color:C&0x00ffffff,
					shadow_color:0x00000000, 
				},
			})
		},
		tabbed_document:{
			transition_dt:0.1,
			h_caption:32, h_bar:4, color:(L?0xffe8e8e8:0xff444444), 
			border_color_active:C,
			border_color:0xff7f7f7f,
			w_menu_button:26,
			h_menu_button:26,
			padding:4,
			caption_drag_tolerance_y:8,
			split_penalty:16,
			shadow_size:10,
			shadow_color:C_shadow,
			menu_bar_color:L?[{x:0,y:0,color:0xffffffff},{x:0,y:1,color:0xffe8e8e8}]:[{x:0,y:0,color:0xff666666},{x:0,y:1,color:0xff444444}],
			menu_bar_border_width:0,
			menu_bar_border_color:L?0xffaaaaaa:0xff444444,
			menu_bar_shadow_size:8,
			menu_bar_shadow_color:C_shadow,
			menu_bar_caption_text_color:L?0xffaaaaaa:0xff7f7f7f,
			bgcolor_split_shade:C&0x7fffffff,
			menu_button_style:{
				transition_dt:0.25,
				round:0,padding:0,
				color:0,
				$:L?{//light
					out:{
						text_color:0xffaaaaaa,
					},
					over:{
						text_color:C,
					},
					down:{
						text_color:UI.lerp_rgba(C,0xff000000,0.2),
					},
					checked_out:{
						text_color:C,
					},
					checked_over:{
						text_color:C,
					},
					checked_down:{
						text_color:UI.lerp_rgba(C,0xff000000,0.2),
					},
				}:{//dark
					out:{
						text_color:0xff7f7f7f,
					},
					over:{
						text_color:0xffe8e8e8,
					},
					down:{
						text_color:0xffcccccc,//UI.lerp_rgba(C,0xff000000,0.2),
					},
					checked_out:{
						text_color:0xffe8e8e8,
					},
					checked_over:{
						text_color:0xffe8e8e8,
					},
					checked_down:{
						text_color:0xffcccccc,//UI.lerp_rgba(C,0xff000000,0.2),
					},
				}
			},
		},
		save_dialog:{
			transition_dt:0.1,
			color:L?0x00d0d0d0:0x00666666,
			$:{
				active:{
					color:L?0x7f000000:0xaa000000,
				},
				inactive:{
					color:0x00000000,
				},
			},
			///////////
			shadow_color:0xff000000,
			shadow_size:32,
			border_width:0,
			round_dlg_rect:32,
			space_dlg_rect_x:48,
			space_dlg_rect:32,
			color_dlg_rect:L?0xf0ffffff:0xf0666666,
			font_text:UI.Font(UI.font_name,40,-50),
			text_color:L?0xff000000:0xffe8e8e8,
			font_buttons:UI.Font(UI.font_name,28,-50),
			space_middle:32,
			space_button:80,
			h_button:48,
			good_button_style:{
				transition_dt:0.1,
				round:32,border_width:0,padding:24,
				$:{
					out:{
						color:[{x:0,y:0,color:UI.lerp_rgba(C,0xffffffff,0.2)},{x:0,y:1,color:UI.lerp_rgba(C,0xff000000,0.1)}],
						icon_color:0xfff0f0f0,
						text_color:0xfff0f0f0,
					},
					over:{
						color:[{x:0,y:0,color:UI.lerp_rgba(C,0xffffffff,0.4)},{x:0,y:1,color:UI.lerp_rgba(C,0xffffffff,0.1)}],
						icon_color:0xffffffff,
						text_color:0xffffffff,
					},
					down:{
						color:[{x:0,y:0,color:UI.lerp_rgba(C,0xffffffff,0.1)},{x:0,y:1,color:UI.lerp_rgba(C,0xff000000,0.2)}],
						icon_color:0xfff0f0f0,
						text_color:0xfff0f0f0,
					},
				}
			},
			bad_button_style:L?{//light
				transition_dt:0.1,
				round:32,border_width:0,padding:24,
				$:{
					out:{
						color:[{x:0,y:0,color:0xff999999},{x:0,y:1,color:0xff666666}],
						icon_color:0xfff0f0f0,
						text_color:0xfff0f0f0,
					},
					over:{
						color:[{x:0,y:0,color:0xffaaaaaa},{x:0,y:1,color:0xff7f7f7f}],
						icon_color:0xffffffff,
						text_color:0xffffffff,
					},
					down:{
						color:[{x:0,y:0,color:0xff888888},{x:0,y:1,color:0xff555555}],
						icon_color:0xfff0f0f0,
						text_color:0xfff0f0f0,
					},
				}
			}:{//dark
				transition_dt:0.1,
				round:32,border_width:0,padding:24,
				$:{
					out:{
						color:[{x:0,y:0,color:0xff7f7f7f},{x:0,y:1,color:0xff444444}],
						icon_color:0xffe8e8e8,
						text_color:0xffe8e8e8,
					},
					over:{
						color:[{x:0,y:0,color:0xff999999},{x:0,y:1,color:0xff333333}],
						icon_color:0xffffffff,
						text_color:0xffffffff,
					},
					down:{
						color:[{x:0,y:0,color:0xff666666},{x:0,y:1,color:0xff222222}],
						icon_color:0xffe8e8e8,
						text_color:0xffe8e8e8,
					},
				}
			},
		},
		code_editor:{
			editor_style:{
				font:UI.Font("res/fonts/inconsolata.ttf",26),
				font_emboldened:UI.Font("res/fonts/inconsolata.ttf",26,200),
				tex_font:UI.Font("res/fonts/cmunrm.ttf",26,0),
				tex_font_emboldened:UI.Font("res/fonts/cmunrm.ttf",26,200),
				font_tilde:UI.Font(UI.icon_font_name,26,100),
				color:L?0xff000000:0xffbfdfdf,
				color2:L?0xff000000:0xffbfdfdf,
				color_normal:L?0xff000000:0xffbfdfdf,
				color_overlay:L?0xff7f7f7f:0xffaaaaaa,
				color_string:L?0xff1c1aa3:0xff0055ff,
				color_number:L?0xff1c1aa3:0xffcfcc8a,
				color_comment:L?0xff2ca033:0xff7f9f7f,
				color_keyword:L?0xffb4771f:0xffaceaea,
				color_type:L?0xffbc470f:0xff8fcfff,
				color_symbol:L?0xff7f7f7f:0xffccdcdc,
				color_symbol2:L?0xff7f7f7f:0xffccdcdc,
				color_meta:L?0xff9a3d6a:0xff8fafdf,
				/////////////
				color_key_decl_func:L?0xff845717:0xffaceaea,
				color_key_decl_class:L?0xffbc470f:0xff8fcfff,
				color_key_decl_macro:L?0xff9a3d6a:0xff8fafdf,
				/////////////
				//virtual hyphen for tex-like files, should be even less obvious than normal symbols
				color_hyphen:L?0xffaaaaaa:0xff555555,
				color_tilde_spell_error:L?0xff1c1aa3:0xff5555ff,
				color_tilde_compiler_error:L?0xff1c1aa3:0xff5555ff,
				color_tilde_compiler_warning:L?0xff2ca033:0xff55ff55,
				/////////////
				color_completing_bracket:L?0x80999999:0x80666666,
				color_auto_edit_range_highlight:L?0x4099ffff:0x40447f7f,
				color_strikeout:L?0x80444444:0x80e8e8e8,
				color_virtual_diff_bold:L?0xff1c1aa3:0xff5555ff,
				/////////////
				bgcolor_ellipsis:L?[{x:0,y:0,color:0xffffffff},{x:1,y:1,color:C_sel}]:[{x:0,y:0,color:C_sel},{x:1,y:1,color:0xff3f3f3f}],
				w_ellipsis:32,
				padding_ellipsis:2,
				h_ellipsis:20,
				/////////////
				bgcolor_selection:L?(C&0x55ffffff):(C_raw&0x22ffffff),
				scroll_transition_dt:0.075,
				/////////////
				caret_width:UI.IS_MOBILE?1:2,
				caret_color:L?0xff000000:0xffbfdfdf,
				caret_flicker:500,
				/////////////
				//rectex_styles:[{color:0,w:32,h:32,round:8,border_width:3,border_color:0xff1c1aa3}],
				rectex_styles:[{color:L?0x7f00ffff:0x7faaaa55,w:32,h:32,round:8,border_width:-8}],
				page_guard_lines:3,
			},
			bgcolor:L?0xffe8e8e8:0xff3f3f3f,
			//padding:6,
			padding:8,
			separator_color:L?0xff999999:0xff000000,
			///////
			//show_top_hint:1,
			top_hint_shadow_color:0x7f000000,
			top_hint_shadow_size:8,
			top_hint_border_width:2,
			top_hint_border_color:L?0xffaaaaaa:0xff222222,
			top_hint_max_lines:3,
			top_hint_max_levels:20,
			x_scroll_shadow_color:0x7f000000,
			x_scroll_shadow_size:8,
			///////
			//show_line_numbers:1,
			line_number_font:UI.Font(UI.font_name,14,-50),
			line_number_bgcolor:L?0xffd0d0d0:0xff333333,
			line_number_color:L?0xff7f7f7f:0xff6a8264,
			line_number_color_focus:L?0xff000000:0xff8DAC85,
			color_cur_line_highlight:L?0xaaffffff:0x55666666,
			///////
			bookmark_font:UI.Font(UI.font_name,12,200),
			bookmark_color:L?[{x:0,y:0,color:0xffffffff},{x:1,y:1,color:C_sel}]:[{x:0,y:0,color:C_sel},{x:1,y:1,color:0xff3f3f3f}],
			bookmark_text_color:L?C:0xffbfdfdf,
			//bookmark_shadow:0xff000000,
			bookmark_border_color:L?C:0xffbfdfdf,
			bookmark_scroll_bar_marker_size:2,
			///////
			fold_button_size:12,
			fold_button_style:{
				transition_dt:0.1,
				round:0,border_width:2,padding:0,
				font:UI.Font("res/fonts/inconsolata.ttf,!",20,-50),
				icon_text_valign:'center',
				$:(L?{//light
					out:{
						border_color:0x55000000,color:0xaae8e8e8,
						icon_color:0x55000000,
						text_color:0x55000000,
					},
					over:{
						border_color:C,color:C,
						icon_color:0xffffffff,
						text_color:0xffffffff,
					},
					down:{
						border_color:C_dark,color:C_dark,
						icon_color:0xffffffff,
						text_color:0xffffffff,
					},
				}:{//dark
					out:{
						border_color:0x55e8e8e8,color:0xaa3f3f3f,
						icon_color:0x55e8e8e8,
						text_color:0x55e8e8e8,
					},
					over:{
						border_color:C,color:C,
						icon_color:0xffe8e8e8,
						text_color:0xffe8e8e8,
					},
					down:{
						border_color:C_dark,color:C_dark,
						icon_color:0xffe8e8e8,
						text_color:0xffe8e8e8,
					},
				}),
			},
			///////
			//color_diff_tag:[{x:0,y:0,color:0xff2ca033&0xffffff},{x:1,y:0,color:0xff2ca033}],
			color_diff_tag:[{x:0,y:0,color:0x002ca033},{x:1,y:0,color:0xff2ca033}],
			sbar_diff_color:(0xff2ca033),
			///////
			//show_minimap:(UI.Platform.ARCH=="linux32"||UI.Platform.ARCH=="android"||UI.Platform.ARCH=="ios")?0:1,
			minimap_font_height:6,
			minimap_page_shadow:L?0x1f000000:0x1faaaaaa,
			minimap_page_border_width:2,
			minimap_page_border_color:L?0xffaaaaaa:0xff000000,
			sbar_eye_font:UI.Font(UI.icon_font_name,12,200),
			sbar_page_shadow:L?0xaa444444:0x7f999999,
			sbar_page_border_color:L?0xff444444:0xff999999,
			sbar_page_border_width:1,
			w_minimap:128,
			///////
			disclaimer_transition_dt:0.1,
			disclaimer_color:L?0xff1c1aa3:0xff5555ff,
			h_find_bar:32,
			find_bar_bgcolor:L?0xffffffff:0xff555555,
			find_bar_color:L?0xffe8e8e8:0xff333333,
			find_bar_round:8,
			find_bar_padding:4,
			find_bar_hint_color:L?0xff7f7f7f:0xffaaaaaa,
			find_bar_shadow_color:C_shadow_dark_aware,
			find_bar_shadow_size:8,
			find_bar_hint_font:UI.Font(UI.font_name,20,-50),
			find_bar_button_size:28,
			find_bar_editor_style:{
				font:UI.Font("res/fonts/inconsolata.ttf",20),
				tex_font:UI.Font("res/fonts/cmunrm.ttf",20,0),
				font_emboldened:UI.Font("res/fonts/inconsolata.ttf",20,200),
				tex_font_emboldened:UI.Font("res/fonts/cmunrm.ttf",20,200),
				font_tilde:UI.Font(UI.icon_font_name,20,100),
				color:L?0xff000000:0xffbfdfdf,
				color2:L?0xff000000:0xffbfdfdf,
				color_normal:L?0xff000000:0xffbfdfdf,
				color_overlay:L?0xff7f7f7f:0xffaaaaaa,
				color_string:L?0xff1c1aa3:0xff0055ff,
				color_number:L?0xff1c1aa3:0xffcfcc8a,
				color_comment:L?0xff2ca033:0xff7f9f7f,
				color_keyword:L?0xffb4771f:0xffaceaea,
				color_type:L?0xffbc470f:0xff8fcfff,
				color_symbol:L?0xff7f7f7f:0xffccdcdc,
				color_symbol2:L?0xff7f7f7f:0xffccdcdc,
				color_meta:L?0xff9a3d6a:0xff8fafdf,
				rectex_styles:[{color:0}],
				bgcolor_selection:L?(C&0x55ffffff):(C_raw&0x22ffffff),
				/////////////
				caret_width:UI.IS_MOBILE?1:2,
				caret_color:L?0xff000000:0xffbfdfdf,
				caret_flicker:500,
			},
			find_item_scale:0.8,
			find_item_context_find:1,
			find_item_context_goto:0,
			find_item_expand_current:4,//in lines
			find_item_separation:5,
			find_item_shadow_color:C_shadow_dark_aware,
			find_item_shadow_size:4,
			find_mode_bgcolor:L?0xffc0c0c0:0xff333333,
			//find_item_replace_highlight_color:0x55007fff,
			find_message_font:UI.Font(UI.font_name,28,-50),
			find_message_color:L?0xff444444:0xff7f7f7f,
			///////
			accands_font:UI.Font(UI.font_name,22,-50),
			accands_id_font:UI.Font(UI.font_name,12,200),
			accands_padding:24,
			accands_left_padding:14,
			accands_sel_padding:2,
			accands_shadow_color:C_shadow_dark_aware,
			accands_shadow_size:8,
			accands_bgcolor:L?0xffffffff:0xff555555,
			accands_round:4,
			accands_border_width:0,
			accands_border_color:0xff000000,
			accands_text_color:L?0xff000000:0xffe8e8e8,
			accands_text_sel_color:L?0xffffffff:0xffe8e8e8,
			accands_sel_bgcolor:C,
			accands_n_shown:5,
			autoedit_button_size:24,
			autoedit_button_padding:2,
			//w_accands:512,
			h_accands:32,
			///////
			auto_minimap_starting_interval:1.0,
			auto_minimap_ending_interval:2.5,
			auto_minimap_starting_threshold:5,
			auto_minimap_ending_threshold:1,
			auto_minimap_transition_dt:0.1,
			w_scroll_bar:20,
			scroll_bar_style:{
				transition_dt:0.1,
				//bgcolor:0xffd0d0d0,
				round:0,
				padding:0,
				szbar_min:32,
				middle_bar:{
					w:12,h:12,
					round:6,
					color:0,
					border_color:0,
				},
				icon_color:0xff999999,
				text_color:0xff999999,//dummy
				$:{
					out:{
						icon_color:[{x:0,y:0,color:0x00999999},{x:1,y:1,color:0x00666666}],
						text_color:0x00999999,//dummy
					},
					over:{
						icon_color:[{x:0,y:0,color:0xff999999},{x:1,y:1,color:0xff666666}],
						text_color:0xff999999,//dummy
					},
				},
			},
			///////
			w_notification:340,
			dx_shake_notification:-300,
			///////
			sxs_shadow_size:6,
			sxs_shadow_color:C_shadow,
			///////
			status_bar_bgcolor:L?[{x:0,y:0,color:0xffffffff},{x:0,y:1,color:0xffd0d0d0}]:[{x:0,y:0,color:0xff7f7f7f},{x:0,y:1,color:0xff444444}],
			status_bar_font:UI.Font(UI.font_name,20,-50),
			status_bar_padding:4,
			status_bar_text_color:L?0xff444444:0xffe8e8e8,
			///////
			wrap_bar_size:3,
			wrap_bar_region_size:8,
			wrap_bar_color:L?0x2f000000:0x7f000000,
		},
		code_editor_notification:{
			transition_dt:0.1,
			padding:6,
			w_icon:24,
			w_text:300,
			shadow_size:8,
			shadow_color:0xff000000,
			color:L?0xffffffff:0xff000000,
			border_color:0xff000000,
			border_width:0,
			round:4,
			styles:[
				{font:UI.Font(UI.font_name,20,0),paragraph_space:16,color:L?0xff000000:0xffe8e8e8},
				{font:UI.Font(UI.font_name,20,100),paragraph_space:16,color:L?0xffb4771f:0xffe3cea6},
				{font:UI.Font(UI.font_name,20,100),paragraph_space:16,color:L?0xff2ca033:0xff8adfb2},
				{font:UI.Font(UI.font_name,20,100),paragraph_space:16,color:L?0xff1c1ae3:0xff999afb},
				{font:UI.Font(UI.font_name,20,100),paragraph_space:16,color:L?0xff007fff:0xff6fbffd},
				{font:UI.Font(UI.font_name,20,100),paragraph_space:16,color:L?0xff9a3d6a:0xffd6b2ca},
				{font:UI.Font(UI.font_name,20,200),paragraph_space:16,color:L?0xffb4771f:0xffe3cea6},
				{font:UI.Font(UI.font_name,20,200),paragraph_space:16,color:L?0xff2ca033:0xff8adfb2},
				{font:UI.Font(UI.font_name,20,200),paragraph_space:16,color:L?0xff1c1ae3:0xff999afb},
				{font:UI.Font(UI.font_name,20,200),paragraph_space:16,color:L?0xff007fff:0xff6fbffd},
				{font:UI.Font(UI.font_name,20,200),paragraph_space:16,color:L?0xff9a3d6a:0xffd6b2ca},
			],
			progress_color:C_sel,
			text_color:L?0xff000000:0xffe8e8e8,
			font:UI.Font(UI.font_name,20,0),
			icon_color:L?0xff000000:0xffe8e8e8,
			icon_font:UI.Font('res/fonts/iconfnt.ttf,!',20),
			icon:'告',
			//////////
			k_shake:400,
			damping_shake:8,
			x_min_shake:0.5,
			dx_min_shake:0.5,
		},
		notebook_view:{
			scroll_transition_dt:0.1,
			max_lines:6,
			w_scroll_bar:20,
			h_caption:36,
			h_separation:0,
			padding:12,
			caption_padding:4,
			caption_font:UI.Font(UI.font_name,28,-50),
			caption_button_padding:0,
			caption_color:C,
			caption_text_color:0xffffffff,
			inactive_caption_color:L?0xff7f7f7f:0xff666666,
			inactive_caption_text_color:L?0xffffffff:0xffe8e8e8,
			color:L?0xffc0c0c0:0xff333333,
			shadow_size:8,
			shadow_color:C_shadow,
			scale:7/8,
			//scale:0.75,
			//scale:0.625,
			button_style:{
				transition_dt:0.1,
				round:0,
				font:UI.Font(UI.icon_font_name,22),border_width:0,padding:1,
				$:{
					out:{
						//border_color:0xff444444,color:0xffffffff,
						border_color:0,color:0,
						icon_color:L?0xff7f7f7f:0xff7f7f7f,
						text_color:L?0xff7f7f7f:0xff7f7f7f,
					},
					over:{
						border_color:0xff444444,color:[{x:0,y:0,color:0xffffffff},{x:0,y:1,color:0xffe8e8e8}],
						icon_color:0xff000000,
						text_color:0xff000000,
					},
					down:{
						border_color:0xff7f7f7f,color:[{x:0,y:0,color:0xff7f7f7f},{x:0,y:1,color:0xff7f7f7f}],
						icon_color:0xff000000,
						text_color:0xff000000,
					},
				}
			},
		},
		tip_window:{
			w_text:512,
			h_text:512,
			button_style:{
				w:48,
				h:64,
				transition_dt:0.1,
				round:0,
				font:UI.Font("res/fonts/inconsolata.ttf,!",48),border_width:2,padding:8,
				$:{
					out:{
						border_color:0x00444444,color:0,
						icon_color:L?0x7f444444:0x7fcccccc,
						text_color:L?0x7f444444:0x7fcccccc,
					},
					over:{
						border_color:0xff444444,color:[{x:0,y:0,color:0xffffffff},{x:0,y:1,color:0xffe8e8e8}],
						icon_color:L?0xff444444:0xffcccccc,
						text_color:L?0xff444444:0xffcccccc,
					},
					down:{
						border_color:0xff7f7f7f,color:[{x:0,y:0,color:0xff7f7f7f},{x:0,y:1,color:0xff7f7f7f}],
						icon_color:L?0xff444444:0xffcccccc,
						text_color:L?0xff444444:0xffcccccc,
					},
				}
			},
			styles:[
				//text
				{font:UI.Font(UI.font_name,32,-50),line_space:4,paragraph_space:24,color:L?0xff444444:0xffcccccc},
				//caption
				{font:UI.Font(UI.font_name,48,-100),line_space:4,paragraph_space:24,color:L?0xff444444:0xffcccccc},
				//code
				{font:UI.Font("res/fonts/inconsolata.ttf,!",24),line_space:4,paragraph_space:24,color:L?0xff444444:0xffcccccc},
				//icon
				{font:UI.Font(UI.icon_font_name,36),raise_height:-6,line_space:4,paragraph_space:24,color:L?0xff444444:0xffcccccc},
				//small icon
				{font:UI.Font(UI.icon_font_name,24),raise_height:-6,line_space:4,paragraph_space:24,color:L?0xff444444:0xffcccccc},
			],
		},
		sxs_new_page:{
			color:L?0xffffffff:0xff444444,
			border_color:0xff000000,
			border_width:0,
			round:0,
			//////////////////////
			h_find_bar:32,
			find_bar_bgcolor:L?0xffffffff:0xff555555,
			find_bar_color:L?0xffe8e8e8:0xff333333,
			find_bar_round:8,
			find_bar_padding:4,
			find_bar_hint_color:L?0xff7f7f7f:0xffaaaaaa,
			find_bar_shadow_color:0x7f000000,
			find_bar_shadow_size:8,
			find_bar_hint_font:UI.Font(UI.font_name,20,-50),
			find_bar_button_size:28,
			find_bar_editor_style:{
				font:UI.Font("res/fonts/inconsolata.ttf",20),
				color:L?0xff000000:0xffe8e8e8,
				bgcolor_selection:L?(C&0x55ffffff):(C_raw&0x22ffffff),
				caret_width:UI.IS_MOBILE?1:2,
				caret_color:L?0xff000000:0xffe8e8e8,
				caret_flicker:500,
			},
		},
		help_page:{
			color:L?0xffffffff:0xff444444,
			border_color:0xff000000,
			border_width:0,
			round:0,
			padding:8,
			w_scroll_bar:20,
			mouse_wheel_speed:2,
			top_hint_shadow_color:0x7f000000,
			top_hint_shadow_size:8,
			top_hint_border_width:2,
			top_hint_border_color:L?0xffaaaaaa:0xff222222,
			///////////////
			h_find_bar:32,
			find_bar_bgcolor:L?0xffffffff:0xff555555,
			find_bar_color:L?0xffe8e8e8:0xff333333,
			find_bar_round:8,
			find_bar_padding:4,
			find_bar_hint_color:L?0xff7f7f7f:0xffaaaaaa,
			find_bar_shadow_color:0x7f000000,
			find_bar_shadow_size:8,
			find_bar_hint_font:UI.Font(UI.font_name,20,-50),
			find_bar_button_size:28,
			find_bar_editor_style:{
				font:UI.Font("res/fonts/inconsolata.ttf",20),
				color:L?0xff000000:0xffe8e8e8,
				bgcolor_selection:L?(C&0x55ffffff):(C_raw&0x22ffffff),
				caret_width:UI.IS_MOBILE?1:2,
				caret_color:L?0xff000000:0xffe8e8e8,
				caret_flicker:500,
			},
			///////////////
			ophl:{
				focus_color:L?0xff00ffff:0xffaaaa55,
				color:L?0x5500ffff:0x55aaaa55,blur:4,
			},
			///////////////
			hr_h:16,
			hr_h_fill:2,
			hr_color:L?0xffd0d0d0:0xff666666,
			w_max_img_width_percentage:0.875,
			w_code_box_percentage:0.875,
			styles:[
				{font:UI.Font("res/fonts/opensans.ttf",24,0),paragraph_space:20,color:L?0xff000000:0xffe8e8e8},//normal
				{font:UI.Font("res/fonts/opensansi.ttf",24,0),paragraph_space:20,color:L?0xff000000:0xffe8e8e8},//emph
				{font:UI.Font("res/fonts/opensans.ttf",24,150),paragraph_space:20,color:L?0xff000000:0xffe8e8e8},//bold
				{
					font:UI.Font("res/fonts/inconsolata.ttf",21,0),
					font_emboldened:UI.Font("res/fonts/inconsolata.ttf",21,150),
					paragraph_space:20,color:L?0xff000000:0xffe8e8e8
				},//code
				{font:UI.Font("res/fonts/opensans.ttf",24,0),paragraph_space:20,color:L?0xff000000:0xffe8e8e8},//list
				{font:UI.Font("res/fonts/opensansi.ttf",24,0),paragraph_space:20,color:L?0xff7f7f7f:0xffaaaaaa,},//quote
				{font:UI.Font("res/fonts/opensans.ttf",32,0),paragraph_space:0,raise_height:-10,color:L?0xff000000:0xffe8e8e8},//h1
				{font:UI.Font("res/fonts/opensans.ttf",28,0),paragraph_space:20,raise_height:-10,color:L?0xff000000:0xffe8e8e8},//h2
				{font:UI.Font("res/fonts/opensans.ttf",26,0),paragraph_space:20,raise_height:-10,color:L?0xff000000:0xffe8e8e8},//h3
				{font:UI.Font("res/fonts/opensans.ttf",24,0),paragraph_space:20,raise_height:-10,color:L?0xff000000:0xffe8e8e8},//h4
			],
		},
		help_item:{
			h:32,
			sel_bgcolor:C,
			sel_bgcolor_deactivated:L?0xff7f7f7f:0xff7f7f7f,
			icon_font:UI.Font(UI.icon_font_name,28),
			name_font:UI.Font(UI.font_name,24,-50),
			name_font_bold:UI.Font(UI.font_name,24,100),
			name_color:L?0xff000000:0xffe8e8e8,
			sel_name_color:L?0xffffffff:0xffe8e8e8,
		},
		binary_editor:{
			font:UI.Font("res/fonts/inconsolata.ttf",24),
			font_edit:UI.Font("res/fonts/inconsolata.ttf",16),
			font_goto:UI.Font("res/fonts/inconsolata.ttf",16),
			mouse_wheel_speed:4,
			color_cur_line_highlight:L?0x55ffffff:0x55666666,
			edit_padding:8,
			edit_bgcolor:L?0xffffffff:0xff3f3f3f,
			edit_border_width:2,
			edit_border_color:C,
			edit_round:4,
			edit_shadow_color:0x7f000000,
			edit_shadow_size:8,
			edit_rect_color:L?0xaa8adfb2:0xaaaaaa55,
			edit_rect_blur:8,
			line_number_font:UI.Font("res/fonts/inconsolata.ttf",14,200),
			line_number_font_small:UI.Font("res/fonts/inconsolata.ttf",8,200),
			line_number_bgcolor:L?0xffd0d0d0:0xff333333,
			line_number_color:L?0xff7f7f7f:0xff6a8264,
			line_number_color_focus:L?0xff000000:0xff8DAC85,
			caret_width:2,
			caret_color:L?0xff000000:0xffbfdfdf,
			caret_flicker:500,
			text_color:L?0xff000000:0xffbfdfdf,
			bgcolor:L?0xffe8e8e8:0xff3f3f3f,
			bgcolor_selection:L?(C&0x55ffffff):(C_raw&0x22ffffff),
			separator_color:L?0xff999999:0xff000000,
			minimap_padding:12,
			minimap_page_shadow:L?0x55000000:0x3faaaaaa,
			minimap_page_border_width:L?2:1,
			minimap_page_border_color:L?0xffaaaaaa:0xff000000,
			//sxs_shadow_size:6,
			//sxs_shadow_color:L?0xaa000000:0xff000000,
			sxs_bgcolor:L?0xffffffff:0xff444444,
			font_panel:UI.Font(UI.font_name,24),
			font_panel_icon:UI.Font(UI.icon_font_name,22),
			font_panel_fixed:UI.Font("res/fonts/inconsolata.ttf",22),
			text_color_panel:L?0xff000000:0xffe8e8e8,
			//w_panel:232,
			w_edit:128,
			h_notification_area:32,
			find_bar_font:UI.Font("res/fonts/inconsolata.ttf",20),
			notification_bgcolor:L?0xffffffff:0xff000000,
			notification_icon_font:UI.Font(UI.icon_font_name,20,0),
			notification_text_color:L?0xff000000:0xffe8e8e8,
			notification_icon_color:L?0xff000000:0xffe8e8e8,
			notification_shadow_size:8,
			notification_shadow_color:C_shadow,
			notification_styles:[
				{font:UI.Font(UI.font_name,20,0),color:L?0xff000000:0xffe8e8e8},
				{font:UI.Font(UI.font_name,20,150),color:L?0xff000000:0xffe8e8e8},
				{font:UI.Font(UI.font_name,20,0),color:L?0xff1c1ae3:0xff999afb},
			],
			color_choices:[
				0xffb4771f,0xff2ca033,0xff1c1ae3,0xff007fff,0xff9a3d6a,
				0xffbfdfdf,0xff8888b8,0xff00aaaa,0xff7f7f7f,0xff000000],
			font_error:UI.Font(UI.font_name,40),
			error_color:L?0xff444444:0xffe8e8e8,
		},
		file_item:{
			h:32,h_dense:32,
			treeview_indent:16,
			h_icon:48,
			icon_font:UI.Font(UI.icon_font_name,48),
			h_icon_dense:28,
			icon_font_dense:UI.Font(UI.icon_font_name,28),
			h_icon_git:16,
			icon_font_git:UI.Font(UI.icon_font_name,16),
			dir_icon_color:L?0xffb4771f:0xffaceaea,
			file_icon_color:L?0xff444444:0xffe8e8e8,
			//caption_font:UI.Font(UI.font_name,20,-50),
			name_font_size:24,
			name_font:UI.Font(UI.font_name,24,-50),
			name_font_bold:UI.Font(UI.font_name,24,100),
			misc_font:UI.Font(UI.font_name,18,-50),
			name_color:L?0xff000000:0xffe8e8e8,
			misc_color:L?0xff7f7f7f:0xff7f7f7f,
			basepath_color:L?0xffcccccc:0xff666666,
			sel_bgcolor:C,
			sel_bgcolor_deactivated:L?0xff7f7f7f:0xff7f7f7f,
			sel_file_icon_color:L?0xffffffff:0xffe8e8e8,
			sel_name_color:L?0xffffffff:0xffe8e8e8,
			sel_misc_color:L?0xffcccccc:0xffcccccc,
			sel_basepath_color:L?0xffcccccc:0xffaaaaaa,
			tag_padding:4,
			tag_round:8,
			tag_border_width:0,
			color_git_untracked:L?0xff9a3d6a:0xff8fafdf,
			color_git_conflicted:L?0xff1c1ae3:0xff5555ff,
			color_git_new:L?0xff2ca033:0xff55ff55,
			color_git_modified:L?UI.lerp_rgba(0xff000000,0xff1c1ae3,0.5):UI.lerp_rgba(0xffe8e8e8,0xff5555ff,0.5),
			button_style:{
				transition_dt:0.1,
				round:0.1,border_width:1,padding:2,
				font:UI.Font(UI.icon_font_name,14),
				$:{
					out:{
						//border_color:0xff444444,color:0xffffffff,
						border_color:0,color:0,
						icon_color:L?0xff7f7f7f:0xff7f7f7f,
						text_color:L?0xff7f7f7f:0xff7f7f7f,
					},
					over:{
						border_color:0xff444444,color:[{x:0,y:0,color:0xffffffff},{x:0,y:1,color:0xffe8e8e8}],
						icon_color:0xff000000,
						text_color:0xff000000,
					},
					down:{
						border_color:0xff7f7f7f,color:[{x:0,y:0,color:0xff7f7f7f},{x:0,y:1,color:0xff7f7f7f}],
						icon_color:0xff000000,
						text_color:0xff000000,
					},
					checked_out:{
						//border_color:0xff444444,color:0xffffffff,
						border_color:0,color:0,
						icon_color:0xffffffff,
						text_color:0xffffffff,
					},
					checked_over:{
						border_color:0xff444444,color:[{x:0,y:0,color:0xffffffff},{x:0,y:1,color:0xffe8e8e8}],
						icon_color:0xff000000,
						text_color:0xff000000,
					},
					checked_down:{
						border_color:0xff7f7f7f,color:[{x:0,y:0,color:0xff7f7f7f},{x:0,y:1,color:0xff7f7f7f}],
						icon_color:0xff000000,
						text_color:0xff000000,
					},
				}
			},
		},
		top_menu:{
			//nothing
		},
		top_menu_item:{
			font:UI.Font(UI.font_name,22,-50),
			padding:8,
			$:{
				active:{
					color:C,
					text_color:L?0xffffffff:0xffe8e8e8,
				},
				inactive:{
					color:0,
					text_color:L?0xff000000:0xffe8e8e8,
				},
			},
		},
		fancy_menu:{
			color:L?0xffe8e8e8:0xff444444,
			border_color:L?0xff444444:0xff000000,
			border_width:1,round:1,
			shadow_color:C_shadow,
			shadow_size:12,
			///////////
			font:UI.Font(UI.font_name,22,-50),
			text_color:L?0xff000000:0xffe8e8e8,
			text_sel_color:L?0xffffffff:0xffe8e8e8,
			icon_color:L?C:C_raw,
			hotkey_color:L?0xff7f7f7f:0xffaaaaaa,
			hotkey_sel_color:L?0xffaaaaaa:0xffaaaaaa,
			sel_bgcolor:C,
			///////////
			vertical_padding:4,
			side_padding:8,
			column_padding:32,
			button_padding:4,
			///////////
			h_separator:8,
			h_separator_fill:1,
			separator_color:L?0xffd0d0d0:0xff666666,
			h_menu_line:32,
			h_button:28,
			w_icon:24,
			checkbox_bgcolor:[{x:0,y:0,color:0xffffffff},{x:0,y:1,color:0xffe8e8e8}],
			button_style:{
				transition_dt:0.1,
				round:0.1,border_width:1,padding:0,
				font:UI.Font(UI.font_name,20,-50),
				icon_font:UI.Font(UI.icon_font_name,18),
				$:L?{//light
					out:{
						//border_color:0xff444444,color:0xffffffff,
						border_color:0xff444444,color:[{x:0,y:0,color:0xffffffff},{x:0,y:1,color:0xffe8e8e8}],
						icon_color:0xff000000,
						text_color:0xff000000,
					},
					over:{
						border_color:C,color:C,
						icon_color:0xffffffff,
						text_color:0xffffffff,
					},
					down:{
						border_color:C_dark,color:C_dark,
						icon_color:0xffffffff,
						text_color:0xffffffff,
					},
					checked_out:{
						border_color:C,color:C,
						icon_color:0xffffffff,
						text_color:0xffffffff,
					},
					checked_over:{
						border_color:C,color:C,
						icon_color:0xffffffff,
						text_color:0xffffffff,
					},
					checked_down:{
						border_color:C,color:C,
						icon_color:0xffffffff,
						text_color:0xffffffff,
					},
				}:{//dark
					out:{
						border_color:0xff000000,color:[{x:0,y:0,color:0xff666666},{x:0,y:1,color:0xff444444}],
						icon_color:0xffe8e8e8,
						text_color:0xffe8e8e8,
					},
					over:{
						border_color:C,color:C,
						icon_color:0xffe8e8e8,
						text_color:0xffe8e8e8,
					},
					down:{
						border_color:C_dark,color:C_dark,
						icon_color:0xffe8e8e8,
						text_color:0xffe8e8e8,
					},
					checked_out:{
						border_color:C,color:C,
						icon_color:0xffe8e8e8,
						text_color:0xffe8e8e8,
					},
					checked_over:{
						border_color:C,color:C,
						icon_color:0xffe8e8e8,
						text_color:0xffe8e8e8,
					},
					checked_down:{
						border_color:C,color:C,
						icon_color:0xffe8e8e8,
						text_color:0xffe8e8e8,
					},
				}
			},
		},
		scroll_bar:{
			transition_dt:0.1,
			//bgcolor:0xffd0d0d0,
			round:0,
			padding:0,
			szbar_min:32,
			middle_bar:{
				w:12,h:12,
				round:6,
				color:[{x:0,y:0,color:0xff999999},{x:1,y:1,color:0xff666666}],
				border_color:0,
			},
			text_color:0xff999999,//dummy
		},
		list_view:{
			color:0,border_color:0,
			size_scroll_bar:12,
			has_scroll_bar:1,
		},
		sxs_options_page:{
			border_width:0,
			color:L?0xffe8e8e8:0xff444444,
			categories:[
				"Display","Controls","Editing","Tools",
				"About","Open Source Licenses","Font Licenses"],
			category_icons:["眼","设","换","Ｕ","单","プ","写"],
		},
		feature_item:{
			h_first:72,
			h_normal:36,
			icon_font:UI.Font(UI.icon_font_name,20),
			icon_fontb:UI.Font(UI.icon_font_name,20,100),
			font:UI.Font(UI.font_name,24),
			font_small:UI.Font(UI.font_name,20),
			text_color:L?0xff000000:0xffe8e8e8,
			icon_color:L?0xff000000:0xffe8e8e8,
			text_color_license:L?0xff7f7f7f:0xffaaaaaa,
			caption_font:UI.Font(UI.font_name,28),
			caption_icon_font:UI.Font(UI.icon_font_name,28),
			caption_color:L?0xffffffff:0xffaaaaaa,
			caption_border_color:0xff000000,
			caption_border_width:1,
			caption_shadow_size:6,
			caption_shadow_color:C_shadow,
			caption_text_color:0xff000000,
			caption_icon_color:L?0xff7f7f7f:0xff444444,
		},
	};
	if(!L){//dark
		styles.edit={
			//animating edit would ruin a lot of object properties
			transition_dt:0,
			scroll_transition_dt:0.1,
			bgcolor_selection:C_raw&0x22ffffff,
			caret_width:UI.IS_MOBILE?1:2,
			caret_color:0xffe8e8e8,
			caret_flicker:500,
		};
		styles.edit_box={
			transition_dt:0.1,
			round:4,padding:8,
			color:0xff333333,
			hint_color:0xffaaaaaa,
			border_width:2,
			border_color:0xff666666,
			font:UI.Font(UI.font_name,UI.font_size),
			text_color:0xffe8e8e8,
			$:{
				blur:{
					border_color:0xff666666,
				},
				focus:{
					border_color:C,
				},
			},
		};
	}
	return styles;
}

