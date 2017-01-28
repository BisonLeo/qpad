var UI=require("gui2d/ui");
var W=require("gui2d/widgets");
var Language=require("res/lib/langdef");
require("res/lib/global_doc");
require("res/lib/code_editor");

UI.MeasureEditorSize=function(doc,w_content){
	var ed=doc.ed;
	var ccnt_tot=ed.GetTextSize();
	var hc=ed.GetCharacterHeightAt(ccnt_tot);
	var ytot=ed.XYFromCcnt(ccnt_tot).y+hc;
	if(doc.NeedXScrollAtWidth(w_content)){
		ytot+=UI.default_styles.code_editor.w_scroll_bar;
	}
	return ytot;
};

var g_re_errors=new RegExp("^error_.*$")
var g_re_cancel_note=new RegExp("^cancel_notification$");
UI.RegisterEditorPlugin(function(){
	if(this.plugin_class!="code_editor"||!this.m_is_main_editor){return;}
	//do not reload errors
	//this.AddEventHandler('load',function(){})
	this.m_error_overlays=[]
	this.AddEventHandler('save',function(){
		for(var i=0;i<this.m_error_overlays.length;i++){
			var err=this.m_error_overlays[i];
			if(!err.is_in_active_doc){continue;}
			err.ccnt0=err.sel_ccnt0.ccnt;
			err.ccnt1=err.sel_ccnt1.ccnt;
		}
	})
	this.AddEventHandler('close',function(){
		for(var i=0;i<this.m_error_overlays.length;i++){
			var err=this.m_error_overlays[i];
			if(!err.is_in_active_doc){continue;}
			err.is_in_active_doc=0;
			err.sel_ccnt0=undefined;
			err.sel_ccnt1=undefined;
			err.highlight=undefined;
		}
	})
	this.AddEventHandler('selectionChange',function(){
		if(this.owner){
			this.owner.DismissNotificationsByRegexp(g_re_errors);
		}
	})
	this.AddEventHandler('menu',function(){
		var ed=this.ed;
		var sel=this.GetSelection()
		if(sel[0]==sel[1]){
			var error_overlays=this.m_error_overlays
			if(error_overlays&&error_overlays.length){
				var ccnt=sel[0]
				var error_overlays_new=[];
				for(var i=0;i<error_overlays.length;i++){
					var err=error_overlays[i]
					if(!err.is_in_active_doc){continue;}
					if(ccnt>=err.sel_ccnt0.ccnt&&ccnt<=err.sel_ccnt1.ccnt){
						var color=(err.color||this.color_tilde_compiler_error)
						this.owner.CreateNotification({
							id:"error_"+err.id.toString(),icon:'警',
							text:err.message,
							icon_color:color,
							//text_color:color,
							color:UI.lerp_rgba(color,UI.default_styles.code_editor_notification.color,UI.TestOption("use_light_theme")?0.95:0.75),
						},"quiet")
					}
					error_overlays_new.push(err);
				}
				this.m_error_overlays=error_overlays_new;
			}
		}
		return 0;
	})
});//.prototype.desc={category:"Tools",name:"Error overlays",stable_name:"error_overlay"};

UI.AddErrorToDocument=function(doc,err){
	var go_prev_line=0
	//if(err.is_in_active_doc==undefined){return;}
	if(err.ccnt0==undefined||err.ccnt1==undefined){
		if(err.line1==undefined){
			err.line1=err.line0
		}
		if(err.col0==undefined){
			err.col0=0;
			err.col1=0;
			if(err.line0==err.line1){
				err.line1++
				go_prev_line=1
			}
		}else if(err.col1==undefined){
			err.col1=1e9;
		}
		err.ccnt0=doc.SeekLC(err.line0,err.col0)
		err.ccnt1=doc.SeekLC(err.line1,err.col1)
	}
	if(!(err.ccnt1>err.ccnt0)){err.ccnt1=err.ccnt0+1;}
	if(go_prev_line&&err.ccnt1>err.ccnt0){err.ccnt1--}
	/////////////////
	if(!err.is_quiet){
		var hl_items=doc.CreateTransientHighlight({
			'depth':1,
			'color':err.color||doc.color_tilde_compiler_error,
			'display_mode':UI.HL_DISPLAY_MODE_TILDE,
			'invertible':0,
		});
		hl_items[0].ccnt=err.ccnt0;err.sel_ccnt0=hl_items[0];hl_items[0].undo_tracked=1
		hl_items[1].ccnt=err.ccnt1;err.sel_ccnt1=hl_items[1];hl_items[1].undo_tracked=1
		err.highlight=hl_items[2];
		err.id=doc.m_error_overlays.length
		err.is_in_active_doc=1
		////////////
		doc.m_error_overlays.push(err)
	}
};

var CreateCompilerError=function(err,is_click){
	if(!err.is_in_active_doc){
		if(!IO.FileExists(err.file_name)){return;}
		if(!is_click){
			var tab=UI.SearchForEditorTab(err.file_name);
			//console.log(err.file_name,err.is_quiet,!!tab);
			//for(var i=0;i<UI.g_all_document_windows.length;i++){
			//	console.log(i,UI.g_all_document_windows[i].file_name)
			//}
			if(!tab){
				var errs=UI.m_unopened_file_errors[err.file_name];
				if(!errs){
					errs=[];
					UI.m_unopened_file_errors[err.file_name]=errs;
				}
				errs.push(err);
				return;
			}
		}
		UI.OpenEditorWindow(err.file_name,function(){
			UI.AddErrorToDocument(this,err);
			if(is_click){
				this.SetSelection(err.ccnt0,err.ccnt1);
				UI.SetFocus(this)
			}
		},is_click?undefined:"quite");
	}else{
		UI.OpenEditorWindow(err.file_name,function(){
			if(!is_click){
				this.SetSelection(err.sel_ccnt0.ccnt,err.sel_ccnt0.ccnt)
				this.CallOnSelectionChange();
				UI.SetFocus(this)
			}
		},is_click?undefined:"quite")
	}
};

var JsifyBuffer=function(a){
	var ret=[];
	for(var i=0;i<a.length;i++){
		ret[i]=a[i];
	}
	return ret;
};

//output parser system
var g_output_parsers=[];
var g_processed_output_parser=undefined;
UI.RegisterOutputParser=function(s_regex_string,n_brackets,fmatch_to_err){
	g_output_parsers.push({s:s_regex_string,n:n_brackets,f:fmatch_to_err});
	g_processed_output_parser=undefined;
};

var MAX_PARSABLE_LINE=1024;
UI.ParseCompilerOutput=function(sline){
	if(Duktape.__byte_length(sline)>MAX_PARSABLE_LINE){return undefined;}
	if(!g_processed_output_parser){
		//create the grand regexp
		var regex=new RegExp(["^((",g_output_parsers.map(function(a){return a.s}).join(")|("),"))\r?\n"].join(""))
		var match_places=[];
		var cur_id=2;
		for(var i=0;i<g_output_parsers.length;i++){
			match_places.push(cur_id);
			cur_id++;
			cur_id+=g_output_parsers[i].n;
			match_places.push(cur_id);
		}
		g_processed_output_parser={
			m_big_regex:regex,
			m_match_places:match_places
		};
	}
	var big_match=undefined;
	try{
		big_match=sline.match(g_processed_output_parser.m_big_regex);
	}catch(err){
		//we may exceed the regexp step limit
	}
	if(!big_match){return undefined;}
	var match_places=g_processed_output_parser.m_match_places;
	for(var i=0;i<match_places.length;i+=2){
		var p_tester=match_places[i];
		if(big_match[p_tester]){
			return g_output_parsers[i>>1].f(big_match.slice(match_places[i],match_places[i+1]))
		}
	}
	return undefined;
}

UI.RegisterCodeEditorPersistentMember("m_compiler_name");
UI.RegisterBuildEnv=function(s_lang_name,obj){
	var desc=Language.GetDescObjectByName(s_lang_name);
	if(!desc.m_buildenvs){
		desc.m_buildenvs=[];
		desc.m_buildenv_by_name={};
		desc.m_buildenv_default_default=obj.name;
	}
	desc.m_buildenvs.push(obj);
	desc.m_buildenv_by_name[obj.name]=obj;
};
UI.GetDefaultBuildEnv=function(s_lang){
	var s_name_default=undefined;
	var compiler_assoc=UI.m_ui_metadata["<compiler_assoc>"];
	if(!compiler_assoc){
		compiler_assoc={};
		UI.m_ui_metadata["<compiler_assoc>"]=compiler_assoc;
	}
	s_name_default=compiler_assoc[s_lang];
	if(!s_name_default){
		var desc=Language.GetDescObjectByName(s_lang);
		s_name_default=desc.m_buildenv_default_default;
	}
	return s_name_default;
}

W.cell_caption_prototype={
	OnMouseDown:function(event){
		if(event.clicks>=2){
			UI.SetFocus(this.owner.cell_list);
			this.owner.cell_list.OnChange(this.m_cell_id);
			this.OnMouseUp(event);
			this.OnDblClick(event);
			return;
		}
		if(event.button==UI.SDL_BUTTON_MIDDLE){
			this.owner.DeleteCell(this.m_cell_id);
			this.owner.m_set_focus_cell_list=1;
			return;
		}
		if(this.owner.cell_list){
			UI.SetFocus(this.owner.cell_list);
			this.owner.cell_list.OnChange(this.m_cell_id);
		}else{
			this.owner.m_last_focus_cell_id=this.m_cell_id*2;
		}
		this.owner.need_save|=65536;
		this.m_drag_ctx={
			cells0:this.owner.m_cells,
			dragging_cell_id:this.m_cell_id,
			dragging_dy:this.y+this.h*0.5-event.y,
			rendering_dy:this.y-event.y,
		};
		this.owner.m_sel_rendering_y0=this.y;
		this.owner.m_sel_rendering_y=this.y;
		this.owner.m_caption_dragged=0;
		for(var i=0;i<this.owner.m_cells.length;i++){
			this.owner.m_cells[i].m_temp_unique_name='$temp_'+i.toString();
			if(this.owner.cell_list){
				this.owner.cell_list[this.owner.m_cells[i].m_temp_unique_name]=this.owner.cell_list['$'+i.toString()];
			}
		}
		UI.CaptureMouse(this);
	},
	OnMouseMove:function(event){
		var ctx=this.m_drag_ctx;
		if(!ctx){return;}
		var cell_list=this.owner.cell_list;
		if(!cell_list){UI.Refresh();return;}
		this.owner.m_sel_rendering_y=ctx.rendering_dy+event.y;
		if(Math.abs(this.owner.m_sel_rendering_y0-this.owner.m_sel_rendering_y)>=4){
			this.owner.m_caption_dragged=1;
		}
		UI.SetFocus(cell_list);
		var cells1=[];
		var did=0;
		var is_invalid=0;
		for(var i=0;i<ctx.cells0.length;i++){
			if(i==ctx.dragging_cell_id){continue;}
			var obj_caption_i=cell_list[ctx.cells0[i].m_temp_unique_name];
			if(!obj_caption_i){
				is_invalid=1;
				break;
			}
			if(!did&&obj_caption_i.y+obj_caption_i.h*0.5>event.y+ctx.dragging_dy){
				if(cells1.length!=ctx.dragging_cell_id){
					ctx.m_dragged=1;
				}
				this.owner.m_last_focus_cell_id=cells1.length*2;
				cells1.push(ctx.cells0[ctx.dragging_cell_id]);
				did=1;
			}
			cells1.push(ctx.cells0[i]);
		}
		if(!is_invalid&&!did){
			if(cells1.length!=ctx.dragging_cell_id){
				ctx.m_dragged=1;
			}
			this.owner.m_last_focus_cell_id=cells1.length*2;
			cells1.push(ctx.cells0[ctx.dragging_cell_id]);
			did=1;
		}
		if(!is_invalid&&ctx.m_dragged&&this.owner.m_caption_dragged){
			this.owner.m_cells=cells1;
		}
		UI.Refresh();
	},
	OnMouseUp:function(event){
		this.OnMouseMove(event);
		if(this.m_drag_ctx&&this.m_drag_ctx.m_dragged){
			this.owner.InvalidateCellList();
			this.owner.m_set_focus_cell_list=1;
			this.owner.need_save|=2;
		}
		UI.ReleaseMouse(this);
		this.m_drag_ctx=undefined;
		this.owner.m_sel_rendering_y=undefined;
		for(var i=0;i<this.owner.m_cells.length;i++){
			if(this.owner.cell_list&&this.owner.m_cells[i].m_temp_unique_name){
				this.owner.cell_list['$'+i.toString()]=this.owner.cell_list[this.owner.m_cells[i].m_temp_unique_name];
			}
			this.owner.m_cells[i].m_temp_unique_name=undefined;
		}
		UI.Refresh();
	},
	OnDblClick:function(){
		this.owner.RunCell(this.m_cell_id);
	},
	OnKeyDown:function(event){
		if(UI.IsHotkey(event,"DELETE")){
			this.owner.DeleteCell(this.m_cell_id);
			this.owner.m_set_focus_cell_list=1;
		}else if(UI.IsHotkey(event,"CTRL+D")){
			var obj=this.owner;
			obj.DupCell();
		}
	},
	OnMouseWheel:function(event){
		if(this.owner.cell_list){
			this.owner.cell_list.OnMouseWheel(event);
		}
	},
};
W.CellCaption=function(id,attrs){
	var obj=UI.StdWidget(id,attrs,"notebook_cell_caption",W.cell_caption_prototype);
	UI.Begin(obj)
		//var bky=obj.y;
		if(obj.owner.m_sel_rendering_y!=undefined&&obj.selected){
			obj.y=obj.owner.m_sel_rendering_y;
		}
		W.PureRegion(id,obj)
		//var sel_bgcolor=obj.owner.activated?obj.mystyle.sel_bgcolor:obj.mystyle.sel_bgcolor_deactivated;
		//if(obj.selected){
		//	UI.RoundRect({
		//		x:obj.x+4,y:obj.y+4,w:obj.w-8,h:obj.h-8,
		//		color:sel_bgcolor})
		//}
		var panel_style=UI.default_styles.notebook_view_v2.panel_style;
		var sel_bgcolor=(UI.nd_focus==obj.owner.cell_list)?obj.mystyle.sel_bgcolor:obj.mystyle.sel_bgcolor_deactivated;
		if(obj.special=='add'){
			W.Button("add_button",{
				x:obj.x,y:obj.y,w:obj.w,h:obj.h-4,
				text:UI._('Add cell'),
				style:obj.button_style,
				OnClick:function(){
					obj.owner.NewCell();
					UI.Refresh();
				}
			})
			UI.End();
			return obj;
		}
		if(obj.selected){
			var shadow_size=panel_style.button_area_shadow_size;
			UI.TopMostWidget(function(obj_y){
				UI.PushCliprect(obj.x,obj.owner.y,obj.w,obj.owner.h);
				UI.RoundRect({
					x:obj.x-shadow_size,y:obj_y-shadow_size,w:obj.w+shadow_size*2,h:obj.h+shadow_size*2,
					color:panel_style.button_area_shadow_color,
					round:shadow_size,border_width:-shadow_size})
				UI.RoundRect({
					x:obj.x,y:obj_y,w:obj.w,h:obj.h,
					color:panel_style.cell_list_bgcolor})
				UI.RoundRect({
					x:obj.x,y:obj_y,w:4,h:obj.h,
					color:sel_bgcolor})
				UI.PopCliprect();
			}.bind(null,obj.y));
			//UI.RoundRect({
			//	x:obj.x+obj.w,y:obj.y,w:16,h:obj.h,
			//	color:[
			//		{x:0,y:0,color:panel_style.cell_list_bgcolor},
			//		{x:1,y:0,color:panel_style.cell_list_bgcolor&0x00ffffff},
			//	]})
		}
		var name_color=(obj.text[0]=='\u2022'?obj.mystyle.dumb_name_color:obj.mystyle.name_color);
		var font=obj.mystyle.font;
		var dims=UI.MeasureText(font,obj.text);
		var frender=function(){
			W.Text("",{
				x:obj.x+8,y:obj.y+(obj.h-dims.h)*0.5-2,
				font:font,text:obj.text,color:name_color,
			});
			if(obj.is_running){
				//stop button
				W.Button("stop",{
					x:obj.x+obj.w-32,y:obj.y,w:32,h:obj.h,
					font:UI.Font(UI.icon_font_name,16),
					text:"✕",
					style:obj.button_style,
					tooltip:UI._("Stop"),
					OnClick:function(){
						obj.owner.KillCell(obj.m_cell_id);
					}
				});
			}
			if(obj.progress>0){
				var y_progress_bar=obj.y+(obj.h-dims.h)*0.5+dims.h-1;
				var w_bar=(obj.w-16);
				if(obj.progress_mode=='normal'){
					UI.RoundRect({
						x:obj.x+8,y:y_progress_bar,
						w:w_bar*obj.progress,h:3,
						color:sel_bgcolor,
						round:1.5,
					});
				}else{//'unknown'
					var p0=Math.max(obj.progress-panel_style.unknown_progress_bar_length,0);
					UI.RoundRect({
						x:obj.x+8+w_bar*p0,y:y_progress_bar,
						w:w_bar*(Math.min(obj.progress,1)-p0),h:3,
						color:sel_bgcolor,
						round:1.5,
					});
					var p1=Math.max(obj.progress-1,0)
					if(p1>0){
						p0=Math.max(p1-panel_style.unknown_progress_bar_length,0);
						UI.RoundRect({
							x:obj.x+8+w_bar*p0,y:y_progress_bar,
							w:w_bar*(p1-p0),h:3,
							color:sel_bgcolor,
							round:1.5,
						});
					}
				}
			}
		}
		if(obj.selected){
			UI.TopMostWidget(frender);
		}else{
			frender();
		}
		//obj.y=bky;
	UI.End()
	return obj
};

UI.m_unopened_file_errors={};

var ClearCompilerError=function(err){
	if(err.sel_ccnt0){err.sel_ccnt0.discard();err.sel_ccnt0=undefined;}
	if(err.sel_ccnt1){err.sel_ccnt1.discard();err.sel_ccnt1=undefined;}
	if(err.highlight){err.highlight.discard();err.highlight=undefined;}
	err.is_in_active_doc=undefined;
	err.is_removed=1;
}

var g_regexp_abspath=new RegExp("^(([a-zA-Z]:/)|(/)|[~])");
var g_v2_separator='\n=====\uDBFF\uDFFF=====\n',g_v2_separator_re=new RegExp(g_v2_separator,'g');
W.notebook_prototype={
	Save:function(){
		var docs=[];
		var parts=[null];
		for(var i=0;i<this.m_cells.length;i++){
			var cell_i=this.m_cells[i];
			var doc_in=cell_i.m_text_in;
			//cell_i.m_text_in=doc_in.ed.GetText();
			parts.push(doc_in.ed.GetText().replace(g_v2_separator_re,'\n\n'));
			cell_i.m_text_in=undefined;
			docs[i*2+0]=doc_in;
			doc_in.saved_point=doc_in.ed.GetUndoQueueLength();
			doc_in.ResetSaveDiff();
			//var doc_out=cell_i.m_text_out;
			//cell_i.m_text_out=doc_out.ed.GetText();
			//docs[i*2+1]=doc_out;
			cell_i.in_m_current_wrap_width=doc_in.m_current_wrap_width;
			cell_i.in_m_enable_wrapping=doc_in.m_enable_wrapping;
			//cell_i.out_m_current_wrap_width=doc_out.m_current_wrap_width;
			//cell_i.out_m_enable_wrapping=doc_out.m_enable_wrapping;
			//doc_out.saved_point=doc_out.ed.GetUndoQueueLength();
			//doc_out.ResetSaveDiff();
		}
		var s=JSON.stringify({cells:this.m_cells,m_last_focus_cell_id:this.m_last_focus_cell_id},null,1)
		parts[0]='v2\n'+s;
		s=parts.join(g_v2_separator);
		var save_ret=UI.SafeSave(this.file_name,s);
		//var sz_std=Duktape.__byte_length(s);
		//var sz_written=IO.CreateFile(this.file_name,s);
		this.m_loaded_time=IO.GetFileTimestamp(this.file_name);
		for(var i=0;i<this.m_cells.length;i++){
			var cell_i=this.m_cells[i];
			cell_i.m_text_in=docs[i*2+0];
			//cell_i.m_text_out=docs[i*2+1];
		}
		//if(!(sz_written>=sz_std)){
		//	return 0;
		//}
		if(!save_ret){
			return 0;
		}
		this.need_save=0;
		UI.RefreshAllTabs()
		return 1;
	},
	SaveMetaData:function(){
		//for now, we do not save editor metadata on notebooks...
	},
	m_cell_plugins:[function(){
		this.m_clickable_ranges=[];
		this.disable_line_numbers=1;
		this.AddEventHandler('UP',function(){
			var sel=this.GetSelection();
			if(sel[0]!=sel[1]){return 1;}
			var y=this.ed.XYFromCcnt(sel[1]).y;
			if(y>0){return 1;}
			var sub_cell_id=this.sub_cell_id;
			if(sub_cell_id>0){
				var tar_id=sub_cell_id-1;
				while(tar_id>=0){
					if(this.notebook_owner.GotoSubCell(tar_id,1)){
						break;
					}
					tar_id--;
				}
				return 0;
			}
			return 1;
		})
		this.AddEventHandler('DOWN',function(){
			var sel=this.GetSelection();
			var size=this.ed.GetTextSize();
			if(sel[0]!=sel[1]){return 1;}
			var y=this.ed.XYFromCcnt(sel[1]).y;
			if(y<this.ed.XYFromCcnt(size).y){return 1;}
			var sub_cell_id=this.sub_cell_id;
			if(sub_cell_id<this.notebook_owner.m_cells.length*2-1){
				var tar_id=sub_cell_id+1;
				while(tar_id<this.notebook_owner.m_cells.length*2){
					if(this.notebook_owner.GotoSubCell(tar_id,0)){
						break;
					}
					tar_id++;
				}
				return 0;
			}
			return 1;
		})
		this.AddEventHandler('selectionChange',function(){
			UI.Refresh();
		})
		if(!this.read_only){
			//interpreter selection
			this.AddEventHandler('menu',function(){
				var desc=this.plugin_language_desc;
				if(desc.m_buildenvs&&desc.m_buildenvs.length>1){
					var menu_run=UI.BigMenu("&Run");
					var obj_notebook=this.notebook_owner;
					var cell_id=this.m_cell_id;
					var cur_compiler_name=(obj_notebook.m_cells[cell_id].m_compiler_name||UI.GetDefaultBuildEnv(obj_notebook.m_cells[cell_id].m_language));
					for(var i=0;i<desc.m_buildenvs.length;i++){
						var s_name_i=desc.m_buildenvs[i].name;
						menu_run.AddNormalItem({
							text:s_name_i,
							icon:(cur_compiler_name==s_name_i)?"对":undefined,
							action:function(name){
								this.m_compiler_name=name;
								UI.Refresh();
							}.bind(obj_notebook.m_cells[cell_id],s_name_i)})
					}
					menu_run=undefined;
				}
			})
			//button list update
			this.AddEventHandler('change',function(){
				var s_check=this.ed.GetText(0,Math.min(this.ed.GetTextSize(),4096));
				var obj_notebook=this.notebook_owner;
				var cell_id=this.m_cell_id;
				if(obj_notebook.m_cells[cell_id]){
					var match=s_check.match(/\[button: (.+)\]/);
					if(match){
						obj_notebook.m_cells[cell_id].m_button_name=match[1];
					}else{
						match=s_check.match(/build script for '(.+)'/);
						if(match){
							obj_notebook.m_cells[cell_id].m_button_name="\u2022 "+match[1];
						}else{
							match=s_check.match(/^#[ \t]*(.+)\n/);
							if(match){
								obj_notebook.m_cells[cell_id].m_button_name=match[1];
							}else if(s_check=='Search result'){
								obj_notebook.m_cells[cell_id].m_button_name="\u2022 Search result";
							}else{
								obj_notebook.m_cells[cell_id].m_button_name=undefined;
							}
						}
					}
				}
				//obj_notebook.m_buttons=undefined;
				UI.Refresh();
			})
		}
		this.AddEventHandler('wrap',function(){
			this.notebook_owner.need_save|=65536;
		})
	}],
	ProcessCell:function(cell_i){
		//////
		var doc_in=UI.CreateEmptyCodeEditor(cell_i.m_language);
		doc_in.plugins=this.m_cell_plugins;
		doc_in.m_enable_wrapping=cell_i.in_m_enable_wrapping||0;
		doc_in.m_current_wrap_width=cell_i.in_m_current_wrap_width||512;
		doc_in.wrap_width=(doc_in.m_enable_wrapping?doc_in.m_current_wrap_width:0);
		doc_in.notebook_owner=this;
		doc_in.disable_x_scroll=1;
		doc_in.Init();
		doc_in.scroll_x=0;doc_in.scroll_y=0;
		if(cell_i.m_text_in){doc_in.ed.Edit([0,0,cell_i.m_text_in],1);}
		doc_in.saved_point=doc_in.ed.GetUndoQueueLength();
		cell_i.m_text_in=doc_in;
		//////
		//var doc_out=UI.CreateEmptyCodeEditor();
		//doc_out.plugins=this.m_cell_plugins;
		//doc_out.m_enable_wrapping=cell_i.out_m_enable_wrapping||0;
		//doc_out.m_current_wrap_width=cell_i.out_m_current_wrap_width||512;
		//doc_out.wrap_width=(doc_out.m_enable_wrapping?doc_out.m_current_wrap_width:0);
		//doc_out.notebook_owner=this;
		//doc_out.read_only=1;
		//doc_out.Init();
		//doc_out.scroll_x=0;doc_out.scroll_y=0;
		//if(cell_i.m_text_out){doc_out.ed.Edit([0,0,cell_i.m_text_out],1);}
		//cell_i.m_text_out=doc_out;
	},
	Load:function(){
		if(UI.enable_timing){
			UI.TimingEvent('before json load');
		}
		var fn_notes=this.file_name;
		this.m_cells=[];
		if(fn_notes){
			this.m_loaded_time=IO.GetFileTimestamp(fn_notes);
			try{
				var s_file_data=IO.ReadAll(fn_notes);
				if(s_file_data.length>3&&s_file_data.substr(0,3)=='v2\n'){
					//format v2 - g_v2_separator
					var parts=s_file_data.substr(3).split(g_v2_separator);
					var json_obj=JSON.parse(parts[0]);
					this.m_cells=json_obj.cells;
					this.m_last_focus_cell_id=(json_obj.m_last_focus_cell_id||0);
					for(var i=0;i<this.m_cells.length;i++){
						this.m_cells[i].m_text_in=(parts[i+1]||'');
					}
				}else{
					var json_obj=JSON.parse(s_file_data);
					this.m_cells=json_obj.cells;
					this.m_last_focus_cell_id=(json_obj.m_last_focus_cell_id||0);
				}
			}catch(err){
				this.m_cells=[];
				this.m_last_focus_cell_id=0;
			}
		}
		//create the initial data thisects
		for(var i=0;i<this.m_cells.length;i++){
			if(UI.enable_timing){
				UI.TimingEvent('before cell '+i.toString());
			}
			var cell_i=this.m_cells[i];
			this.ProcessCell(cell_i);
			cell_i.m_text_in.m_cell_id=i;
			if(UI.enable_timing){
				UI.TimingEvent('before CallOnChange');
			}
			cell_i.m_text_in.CallOnChange();
		}
		//if(!this.m_cells.length){
		//	this.NewCell();
		//}
	},
	Reload:function(){
		for(var i=0;i<this.m_cells.length;i++){
			this.ClearCellOutput(i)
			var doc_in=this.m_cells[i].m_text_in;
			//var doc_out=this.m_cells[i].m_text_out;
			doc_in.OnDestroy();
			//doc_out.OnDestroy();
			this["doc_in_"+i.toString()]=undefined;
			//this["doc_out_"+i.toString()]=undefined;
		}
		this.m_cells=undefined;
		this.Load()
	},
	NewCell:function(template,id_add_after,is_quiet){
		var cell_i=(template||{});
		if(cell_i.m_language==undefined){
			cell_i.m_language=(UI.Platform.ARCH=="win32"||UI.Platform.ARCH=="win64")?"Windows BAT":'Unix Shell Script';
		}
		this.ProcessCell(cell_i)
		if(id_add_after==undefined){
			this.m_cells.push(cell_i);
		}else{
			var ret=[];
			for(var i=0;i<this.m_cells.length;i++){
				ret.push(this.m_cells[i]);
				if(i==id_add_after){
					ret.push(cell_i);
				}
			}
			this.m_cells=ret;
		}
		for(var i=0;i<this.m_cells.length;i++){
			this.m_cells[i].m_cell_id=i;
		}
		this.need_save|=2;
		///////////
		cell_i.m_text_in.saved_point=-1;
		if(this.cell_list&&UI.nd_focus==this.cell_list){
			this.m_set_focus_cell_list=1;
		}
		if(is_quiet){
			this.m_last_focus_cell_id=cell_i.m_cell_id*2;
		}else{
			this.GotoSubCell(cell_i.m_cell_id*2);
		}
		this.InvalidateCellList();
		UI.Refresh();
	},
	DupCell:function(){
		var cell_i=undefined;
		if(this.m_last_focus_cell_id!=undefined){
			cell_i=this.m_cells[this.m_last_focus_cell_id>>1];
		}
		if(cell_i){
			var bk_proc=cell_i.m_proc;
			cell_i.m_proc=undefined;
			this.NewCell(JSON.parse(JSON.stringify(cell_i)),this.m_last_focus_cell_id>>1);
			cell_i.m_proc=bk_proc;
		}
	},
	SwapCells:function(id0,id1){
		var tmp=undefined;
		var s0="doc_in_"+id0.toString();
		var s1="doc_in_"+id1.toString();
		tmp=this[s0];this[s0]=this[s1];this[s1]=tmp;
		s0="doc_out_"+id0.toString();
		s1="doc_out_"+id1.toString();
		tmp=this[s0];this[s0]=this[s1];this[s1]=tmp;
		tmp=this.m_cells[id0];this.m_cells[id0]=this.m_cells[id1];this.m_cells[id1]=tmp;
		UI.Refresh()
	},
	GetSpecificCell:function(s_mark,s_language,create_if_not_found){
		var lg=Duktape.__byte_length(s_mark);
		for(var i=0;i<this.m_cells.length;i++){
			var cell_i=this.m_cells[i];
			var doc_in=cell_i.m_text_in;
			var s_check=doc_in.ed.GetText(0,Math.min(doc_in.ed.GetTextSize(),4096));
			if(s_check.indexOf(s_mark)>=0){
				return i;
			}
		}
		if(!create_if_not_found){return -1;}
		var id=this.m_cells.length;
		this.NewCell({m_language:s_language,m_text_in:s_mark},undefined,"quiet")
		return id;
	},
	DeleteCell:function(id){
		var ret=[];
		for(var i=0;i<this.m_cells.length;i++){
			if(i==id){
				var proc_desc=this.m_cells[i].m_proc;
				if(proc_desc){
					proc_desc.proc.Terminate()
					UI.Refresh()
					return;
				}
				this.ClearCellOutput(i)
				continue;
			}
			ret.push(this.m_cells[i]);
		}
		this.m_cells=ret;
		for(var i=0;i<this.m_cells.length;i++){
			this.m_cells[i].m_cell_id=i;
		}
		this.need_save|=2;
		this.InvalidateCellList();
		this.m_last_focus_cell_id=Math.max(Math.min(this.m_last_focus_cell_id,(this.m_cells.length-1)*2),0);
		UI.Refresh()
	},
	GetSubCell:function(sub_cell_id){
		var cur_cell=this.m_cells[sub_cell_id>>1];
		if(cur_cell){
			//cur_cell.m_text_out
			return ((sub_cell_id&1)?null:cur_cell.m_text_in);
		}
		return undefined;
	},
	GotoSubCell:function(sub_cell_id,sel_side){
		if(sub_cell_id&1){
			//we no longer have output cells
			return 0;
		}
		var doc=this.GetSubCell(sub_cell_id);
		if(!doc){
			return 0;
		}
		this.m_last_focus_cell_id=sub_cell_id;
		this.need_save|=65536;
		if(this.cell_list){
			this.cell_list.value=(sub_cell_id>>1);
			this.cell_list.AutoScroll();
			//console.log(this.cell_list.value,this.cell_list.position);
		}
		UI.SetFocus(doc)
		if(sel_side!=undefined){
			var ccnt=0;
			if(sel_side>0){
				ccnt=doc.ed.GetTextSize()
			}
			doc.SetSelection(ccnt,ccnt)
		}
		UI.Refresh()
		return 1;
	},
	WriteCellOutput:function(id,s){
		var cell_i=this.m_cells[id];
		if(!cell_i.m_output_terminal){
			var cols=80;
			var rows=25;
			var dims=UI.MeasureText(UI.default_styles.terminal.font,' ');
			if(this.w>this.h){
				cols=Math.max(Math.floor(this.w/this.panel_style.scale/dims.w*0.5/8)*8,8);
				rows=Math.max(Math.ceil(this.h/this.panel_style.scale/dims.h),2);
			}else{
				cols=Math.max(Math.ceil(this.w/this.panel_style.scale/dims.w/8)*8,8);
				rows=Math.max(Math.floor(this.h/this.panel_style.scale/dims.h*0.5),2);
			}
			cols=(cols||80);
			rows=(rows||25);
			cell_i.m_output_terminal=Object.create(UI.default_styles.terminal);
			var proc=cell_i.m_output_terminal;
			proc.cols=cols;
			proc.rows=rows;
			UI.InitTerminal(proc,proc.cols,proc.rows);
		}
		cell_i.m_output_terminal.m_term.write(s);
		UI.Refresh()
	},
	ClearCellOutput:function(id){
		var cell_i=this.m_cells[id];
		if(cell_i.m_output_terminal&&cell_i.m_output_terminal.m_term){
			if(cell_i.m_output_terminal.m_term.compiler_errors){
				for(var i=0;i<cell_i.m_output_terminal.m_term.compiler_errors.length;i++){
					ClearCompilerError(cell_i.m_output_terminal.m_term.compiler_errors[i]);
				}
				UI.RefreshAllTabs();
			}
			cell_i.m_output_terminal.m_term.destroy();
			cell_i.m_output_terminal.m_term=undefined;
			cell_i.m_output_terminal=undefined;
		}
		cell_i.m_proc=undefined;
	},
	RunCell:function(id){
		var cell_i=this.m_cells[id];
		var doc=cell_i.m_text_in;
		if(cell_i.m_proc){
			if(doc&&doc.owner){
				var noti_new={
					id:"cancel_notification",icon:'警',
					text:'This cell is already running. Repeat your action to cancel it and re-run.',
				};
				var noti_created=doc.owner.CreateNotification(noti_new);
				if(noti_new!=noti_created){
					//we already have that notification
					doc.owner.DismissNotificationsByRegexp(g_re_cancel_note);
					this.KillCell(id)
					//cell_i.m_proc.is_terminated="forced";
					//continue execution!
				}else{
					UI.SetFocus(doc);
					return "focus";
				}
			}else{
				return;
			}
		}
		this.ClearCellOutput(id)
		var desc=Language.GetDescObjectByName(cell_i.m_language);
		if(!desc.m_buildenv_by_name){return;}
		var obj_buildenv=desc.m_buildenv_by_name[cell_i.m_compiler_name||UI.GetDefaultBuildEnv(cell_i.m_language)];
		if(!obj_buildenv||!obj_buildenv.CreateInterpreterCall){return;}
		//direct execution for _nix, %COMSPEC% for Windows
		//coulddo: manual interpreter setup
		var sext=(desc&&desc.extensions&&desc.extensions[0]||(cell_i.m_language=='Unix Shell Script'?"sh":"bat"));
		var fn_script=IO.GetNewDocumentName("qnb",sext,"temp")
		var s_code=cell_i.m_text_in.ed.GetText();
		IO.CreateFile(fn_script,s_code)
		var args=obj_buildenv.CreateInterpreterCall(fn_script,undefined);
		if(typeof(args)=='string'){
			//qpad js
			try{
				eval(s_code);
			}catch(e){
				this.WriteCellOutput(id,e.stack);
			}
			this.need_save|=65536;
			UI.Refresh()
			return;
		}
		var spath=UI.GetPathFromFilename(this.file_name);
		//var s_prj_mark="build script for '"
		//var p_prj_fn=s_code.indexOf(s_prj_mark);
		//if(p_prj_fn>=0){
		//	var s_file_name=s_code.substr(p_prj_fn+s_prj_mark.length);
		//	var p_other_quote=s_file_name.indexOf("'")
		//	if(p_other_quote>=0){
		//		s_file_name=s_file_name.substr(0,p_other_quote);
		//		if(IO.FileExists(s_file_name)){
		//			spath=UI.GetPathFromFilename(s_file_name)
		//		}
		//	}
		//}
		if(s_code.indexOf('[new window]')>=0){
			//new window
			IO.RunProcess(args,spath,1);
			UI.Refresh();
			return;
		}
		if(s_code.indexOf('[new term]')>=0){
			//new terminal
			//ignore previous cols / rows
			var cols=132;
			var rows=24;
			if(UI.DetectMSYSTools()){
				args=["script","--return","-qfc","export TERM=xterm;stty cols "+cols+";stty rows "+rows+";"+IO.ShellCmd(args),"/dev/null"];
			}
			UI.OpenTerminalTab({
				args:args,
				spath:spath,
				auto_close:1,
				cols:cols,
				rows:rows,
			});
			UI.Refresh();
			return;
		}
		for(var i=0;i<this.m_cells.length;i++){
			this.m_cells[i].m_cell_id=i;
		}
		////////////////////////////////
		//create the embedded terminal
		var cols=80;
		var rows=25;
		var dims=UI.MeasureText(UI.default_styles.terminal.font,' ');
		if(this.w>this.h){
			cols=Math.max(Math.floor(this.w/this.panel_style.scale/dims.w*0.5/8)*8,8);
			rows=Math.max(Math.ceil(this.h/this.panel_style.scale/dims.h),2);
		}else{
			cols=Math.max(Math.ceil(this.w/this.panel_style.scale/dims.w/8)*8,8);
			rows=Math.max(Math.floor(this.h/this.panel_style.scale/dims.h*0.5),2);
		}
		cols=(cols||80);
		rows=(rows||25);
		var interactive_ified=0;
		if(s_code.indexOf('[interactive]')>=0){
			//terminal
			if(UI.DetectMSYSTools()){
				args=["script","--return","-qfc","export TERM=xterm;stty cols "+cols.toString()+";stty rows "+rows.toString()+";"+IO.ShellCmd(args),"/dev/null"];
				interactive_ified=1;
			}
		}
		var proc=Object.create(UI.default_styles.terminal);
		proc.cols=cols;
		proc.rows=rows;
		var fonfinalize=function(){
			//finalization callback;
			var code=this.GetExitCode()
			if(code==259){
				UI.setTimeout(fonfinalize,100);
				return;
			}
			if(code!=0&&!cell_i.m_has_any_error){
				this.m_term.write("=== fatal error: the script has returned an error "+code+"\n")
			}
			IO.DeleteFile(fn_script);
			cell_i.m_proc=undefined;
			this.m_term.progress_value=-1;
			UI.OnApplicationSwitch()
			UI.Refresh();
			//completion notification
			if(UI.TestOption("completion_notification")&&UI.ShowCompletionNotification){
				UI.ShowCompletionNotification();
			}
		}.bind(proc);
		if(UI.InitTerminal(proc,proc.cols,proc.rows,args,spath,fonfinalize)){
			//do nothing
		}else{
			this.WriteCellOutput(id,"=== fatal error: failed to execute the script\n")
			IO.DeleteFile(fn_script)
		}
		cell_i.m_output_terminal=proc;
		cell_i.m_proc=proc;
		proc.interactive_ified=interactive_ified;
		proc.m_unknown_progress=0;
		proc.m_t_unknown_progress=UI.m_frame_tick;
		proc.m_term.m_current_path=spath;
		this.m_last_focus_cell_id=id*2+0;
		UI.Refresh()
	},
	KillCell:function(id){
		var cell_i=this.m_cells[id];
		if(cell_i.m_proc&&!cell_i.m_proc.is_terminated){
			this.WriteCellOutput(cell_i.m_cell_id,"Stopped...\n")
			//cell_i.m_proc.is_terminated=1;
			if(cell_i.m_proc.interactive_ified){
				//hack: interactive processes... could use a ctrl+c
				cell_i.m_proc.m_term.send('\x03\x04');
			}else{
				cell_i.m_proc.Terminate()
			}
			UI.Refresh()
		}
	},
	OnDestroy:function(){
		for(var i=0;i<this.m_cells.length;i++){
			var proc_desc=this.m_cells[i].m_proc;
			if(proc_desc){
				proc_desc.Terminate()
			}
			this.ClearCellOutput(i)
		}
	},
	UpdateLanguage:function(id,name){
		var cell_i=this.m_cells[id];
		cell_i.m_language=name;
		var doc_in=cell_i.m_text_in;
		var s_text=doc_in.ed.GetText();
		var sel0=doc_in.sel0.ccnt;
		var sel1=doc_in.sel1.ccnt;
		var need_save=(doc_in.saved_point!=doc_in.ed.GetUndoQueueLength());
		doc_in.OnDestroy()
		/////////
		doc_in=UI.CreateEmptyCodeEditor(cell_i.m_language);
		doc_in.plugins=this.m_cell_plugins;
		doc_in.wrap_width=0;
		doc_in.m_enable_wrapping=0;
		doc_in.m_current_wrap_width=512;
		doc_in.notebook_owner=this;
		doc_in.disable_x_scroll=1;
		doc_in.Init();
		doc_in.scroll_x=0;doc_in.scroll_y=0;
		if(s_text){doc_in.ed.Edit([0,0,s_text],1);}
		doc_in.saved_point=(need_save?-1:doc_in.ed.GetUndoQueueLength());
		cell_i.m_text_in=doc_in;
		this.need_save|=65536;
		UI.SetFocus(doc_in)
		UI.Refresh()
	},
	InvalidateCellList:function(){
		this.m_cell_list_old_position=(this.cell_list&&this.cell_list.position);
		this.cell_list=undefined;
	},
};
W.NotebookView=function(id,attrs){
	if(UI.enable_timing){
		UI.TimingEvent("entering NotebookView");
	}
	var obj=UI.StdWidget(id,attrs,"notebook_view_v2",W.notebook_prototype);
	UI.Begin(obj)
	UI.RoundRect({
		x:obj.x,y:obj.y,w:obj.w,h:obj.h,
		color:obj.panel_style.cell_list_bgcolor,
	})
	W.PureRegion(id,obj)
	//if(!obj.m_buttons){
	//	obj.m_buttons=buttons;
	//}
	//buttons=obj.m_buttons;
	if(!obj.m_cells){
		if(UI.enable_timing){
			UI.TimingEvent('before Load()');
		}
		obj.Load();
		if(UI.enable_timing){
			UI.TimingEvent('after Load()');
		}
	}
	var buttons=[];
	if(obj.m_cells){
		for(var i=0;i<obj.m_cells.length;i++){
			var cell_i=obj.m_cells[i];
			var s_btn_name=(cell_i.m_button_name||"\u2022 untitled")
			var progress=undefined;
			var progress_mode=undefined;
			if(cell_i.m_proc){
				progress=cell_i.m_proc.m_term.progress_value;
				if(!(progress>=0)){progress=undefined;}
				progress_mode='normal';
				if(progress==undefined){
					progress=cell_i.m_proc.m_unknown_progress;
					var dt=Duktape.__ui_seconds_between_ticks(cell_i.m_proc.m_t_unknown_progress,UI.m_frame_tick);
					cell_i.m_proc.m_t_unknown_progress=UI.m_frame_tick;
					progress_mode='unknown';
					cell_i.m_proc.m_unknown_progress+=dt/obj.panel_style.unknown_progress_period;
					if(cell_i.m_proc.m_unknown_progress>1+obj.panel_style.unknown_progress_bar_length){
						cell_i.m_proc.m_unknown_progress=obj.panel_style.unknown_progress_bar_length;
					}
					//if(UI.MyWindowHasFocus()){
					//	UI.RefreshIn(100);
					//}
				}
			}
			var doc_in=(cell_i&&cell_i.m_text_in);
			if(!obj.is_default&&doc_in){
				if((doc_in.saved_point||0)!=doc_in.ed.GetUndoQueueLength()){
					s_btn_name=s_btn_name+'*';
				}
			}
			buttons.push({
				id:cell_i.m_temp_unique_name,
				m_cell_id:i,
				text:s_btn_name,
				h:obj.panel_style.h_button,
				progress:progress,
				progress_mode:progress_mode,
				is_running:!!cell_i.m_proc,
			});
		}
	}
	var w_buttons=96;
	for(var i=0;i<buttons.length;i++){
		var w_button_i=32+UI.MeasureText(UI.default_styles.button.font,buttons[i].text).w;
		w_buttons=Math.max(w_buttons,w_button_i);
	}
	w_buttons=Math.min(w_buttons,obj.w*obj.panel_style.max_button_width_ratio);
	for(var i=0;i<buttons.length;i++){
		buttons[i].w=w_buttons-16;
	}
	UI.PushSubWindow(obj.x+w_buttons,obj.y,obj.w-w_buttons,obj.h,obj.panel_style.scale)
	var bk_dims=[obj.x,obj.y,obj.w,obj.h];
	obj.x=0;obj.y=0;obj.w=(obj.w-w_buttons)/obj.panel_style.scale;obj.h/=obj.panel_style.scale;
	var n0_topmost=UI.RecordTopMostContext()
	if(obj.m_last_focus_cell_id==undefined){
		obj.m_last_focus_cell_id=0;
	}
	//update need_save... a bit messy here
	obj.need_save&=~1;
	for(var i=0;i<obj.m_cells.length;i++){
		var cell_i=obj.m_cells[i];
		var doc_in=(cell_i&&cell_i.m_text_in);
		if(doc_in){
			if((doc_in.saved_point||0)!=doc_in.ed.GetUndoQueueLength()){
				obj.need_save|=1;
				break;
			}
		}
	}
	//note: the *docs* have to exist even when they're not focused - they may have unsaved changes
	var focus_cell_id=obj.m_last_focus_cell_id;
	var cur_cell=obj.m_cells[focus_cell_id>>1];
	for(var i=0;i<obj.m_cells.length;i++){
		obj.m_cells[i].m_cell_id=i;
	}
	if(cur_cell){
		if(UI.nd_focus==cur_cell.m_text_in){
			focus_cell_id&=-2;
			obj.m_last_focus_cell_id=focus_cell_id;
		}
		if(cur_cell.m_output_terminal&&UI.nd_focus==cur_cell.m_output_terminal){
			focus_cell_id=(focus_cell_id&-2)+1;
			obj.m_last_focus_cell_id=(focus_cell_id&-2);
		}
		//////
		//var h_in=0,h_out=0;
		if(cur_cell.m_text_in){
			cur_cell.m_text_in.sub_cell_id=(focus_cell_id&-2)+0;
			cur_cell.m_text_in.m_cell_id=(focus_cell_id>>1);
			//h_in=MeasureEditorSize(cur_cell.m_text_in,obj.w);
		}
		//if(cur_cell.m_text_out){
		//	cur_cell.m_text_out.sub_cell_id=(focus_cell_id&-2)+1;
		//	cur_cell.m_text_out.m_cell_id=(focus_cell_id>>1);
		//	h_out=MeasureEditorSize(cur_cell.m_text_out,obj.w);
		//}
		//terminal
		var w_editor=obj.w;
		var h_editor=obj.h;
		var term_side="x";
		if(cur_cell.m_output_terminal){
			var term=cur_cell.m_output_terminal;
			var dims=UI.MeasureText(UI.default_styles.terminal.font,' ');
			var w_term=term.m_term.cols*dims.w;
			var h_term=term.m_term.rows*dims.h;
			var value=term.GetScrollValue();
			var w_term_area=w_term+(value>=0?term.w_scroll_bar:0);
			var scale=Math.min(Math.min(obj.w/w_term_area,obj.h/h_term),1);
			term.font=UI.ScaleFont(UI.default_styles.terminal.font,scale);
			w_term_area*=scale;
			h_term*=scale;
			var x_term=obj.x+obj.w-w_term_area;
			var y_term=obj.y+obj.h-h_term;
			term.x=x_term;
			term.y=y_term;
			term.w=w_term_area;
			term.h=h_term;
			if(obj.w-w_term_area>obj.h-h_term){
				w_editor=obj.w-w_term_area-term.panel_style.border_width;
				//UI.RoundRect({x:x_term,y:obj.y,w:w_term_area,h:obj.h,color:C_bg,border_width:0});
				y_term=obj.y+(obj.h-h_term)*0.5;
				term_side="x";
			}else{
				h_editor=obj.h-h_term-term.panel_style.border_width;
				//UI.RoundRect({x:obj.x,y:y_term,w:obj.w,h:h_term,color:C_bg,border_width:0});
				x_term=obj.x+(obj.w-w_term_area)*0.5;
				term_side="y";
			}
		}
		var doc=cur_cell.m_text_in;
		if(doc){
			//var h_doc=Math.min(MeasureEditorSize(doc,obj.w),obj.h);
			W.CodeEditor("cell_"+focus_cell_id.toString(),{
				disable_minimap:1,
				doc:doc,
				read_only:doc.read_only,
				x:obj.x,y:obj.y,w:w_editor,h:h_editor,
			});
			//UI.PushCliprect(obj.x,obj.y+h_doc,obj.w,obj.panel_style.shadow_size);
			//UI.RoundRect({
			//	x:obj.x-obj.panel_style.shadow_size,y:obj.y+h_doc-obj.panel_style.shadow_size,
			//	w:obj.w+obj.panel_style.shadow_size*2,h:obj.panel_style.shadow_size*2,
			//	round:obj.panel_style.shadow_size,border_width:-obj.panel_style.shadow_size,
			//	color:obj.panel_style.shadow_color
			//})
			//UI.PopCliprect();
		}
		//dismiss the run-twice notification
		if(!cur_cell.m_proc){
			var obj_widget=obj["cell_"+(focus_cell_id&-2).toString()];
			if(obj_widget){
				obj_widget.DismissNotificationsByRegexp(g_re_cancel_note);
			}
		}
		//actually render the terminal
		if(cur_cell.m_output_terminal){
			W.PureRegion("cell_term_"+(focus_cell_id&-2).toString(),term);
			//var sz_expand=term.panel_style.border_width+term.panel_style.shadow_size_embedded;
			//UI.RoundRect({
			//	x:x_term-sz_expand,y:y_term-sz_expand,
			//	w:w_term_area+sz_expand*2,h:h_term+sz_expand*2,
			//	color:term.panel_style.shadow_color,
			//	border_width:-term.panel_style.shadow_size_embedded,
			//	round:term.panel_style.shadow_size_embedded,
			//});
			//var C_bg=term.m_term.getBgcolor();
			var C_bg=obj.panel_style.cell_list_bgcolor;
			var sz_expand=term.panel_style.shadow_size_embedded;
			if(term_side=="x"){
				UI.RoundRect({
					x:obj.x+w_editor-sz_expand,y:obj.y-sz_expand,
					w:sz_expand*2,h:obj.h+sz_expand*2,
					color:term.panel_style.shadow_color,
					border_width:-term.panel_style.shadow_size_embedded,
					round:term.panel_style.shadow_size_embedded,
				});
				UI.RoundRect({x:obj.x+w_editor,y:obj.y,w:w_term_area,h:obj.h,color:C_bg,border_width:0});
			}else{
				UI.RoundRect({
					x:obj.x-sz_expand,y:obj.y+h_editor-sz_expand,
					w:obj.w+sz_expand*2,h:sz_expand*2,
					color:term.panel_style.shadow_color,
					border_width:-term.panel_style.shadow_size_embedded,
					round:term.panel_style.shadow_size_embedded,
				});
				UI.RoundRect({x:obj.x,y:obj.y+h_editor,w:obj.w,h:h_term,color:C_bg,border_width:0});
			}
			UI.RoundRect({
				x:x_term-term.panel_style.border_width,y:y_term-term.panel_style.border_width,
				w:w_term_area+term.panel_style.border_width*2,h:h_term+term.panel_style.border_width*2,
				color:term.panel_style.border_color,
				//round:term.panel_style.border_width,
			});
			UI.PushCliprect(x_term,y_term,w_term_area,h_term);
			term.Render(x_term,y_term,w_term,h_term);
			UI.PopCliprect();
			if(value>=0){
				W.ScrollBar("cell_term_sbar_"+(focus_cell_id&-2).toString(),{
					x:x_term+w_term, y:y_term, w:term.w_scroll_bar, h:h_term, dimension:'y',
					page_size:term.m_term.rows, total_size:term.m_term.n_valid_lines-term.m_term.rows, value:value,
					OnChange:function(value){
						term.SetScrollValue(value)
						UI.Refresh()
					},
				});
			}
		}
		//todo: buttons
	}
	if(obj.activated){
		var menu_notebook=undefined;
		menu_notebook=UI.BigMenu("Note&book");
		menu_notebook.AddNormalItem({
			text:"&New cell",
			icon:'新',enable_hotkey:1,key:"CTRL+M",action:obj.NewCell.bind(obj)})
		if(cur_cell&&!obj.m_cells[focus_cell_id>>1].m_proc&&!(focus_cell_id&1)){
			menu_notebook.AddNormalItem({
				text:"&Run cell",
				enable_hotkey:1,key:"CTRL+RETURN",action:(function(){
					this.RunCell(focus_cell_id>>1)
				}).bind(obj)})
		}
		if(cur_cell){
			obj.m_last_focus_cell_id=focus_cell_id;
			menu_notebook.AddNormalItem({
				text:"&Delete cell",
				enable_hotkey:1,key:"SHIFT+CTRL+X",
				action:obj.DeleteCell.bind(obj,focus_cell_id>>1)})
			menu_notebook.AddNormalItem({
				text:"&Clone cell",
				action:obj.DupCell.bind(obj)});
			menu_notebook.AddSeparator();
			if(cur_cell.m_output_terminal){
				menu_notebook.AddNormalItem({
					text:"Clear &output",
					enable_hotkey:1,key:"SHIFT+CTRL+C",
					action:obj.ClearCellOutput.bind(obj,focus_cell_id>>1)})
			}
			menu_notebook.AddButtonRow({text:"Set cell mode"},[
				{text:"new_window",icon:"窗",tooltip:'New window',action:function(){
					SetCellRunTag(cur_cell.m_text_in,"[new window]");
				}},{text:"new_term",icon:"格",tooltip:'New tab',action:function(){
					SetCellRunTag(cur_cell.m_text_in,"[new term]");
				}},{text:"local_term",icon:"Ｖ",tooltip:'Interactive terminal',action:function(){
					SetCellRunTag(cur_cell.m_text_in,"[interactive]");
				}},{text:"dumb_term",icon:"控",tooltip:'Simple terminal',action:function(){
					SetCellRunTag(cur_cell.m_text_in,"[simple]");
				}}])
		}
		menu_notebook=undefined;
	}
	UI.FlushTopMostContext(n0_topmost)
	UI.PopSubWindow()
	obj.x=bk_dims[0];obj.y=bk_dims[1];obj.w=bk_dims[2];obj.h=bk_dims[3];
	//buttons
	var shadow_size=obj.panel_style.button_area_shadow_size;
	UI.PushCliprect(obj.x,obj.y,w_buttons,obj.h);
	UI.RoundRect({
		x:obj.x+w_buttons-shadow_size,y:obj.y-shadow_size,w:shadow_size*2,h:obj.h+shadow_size*2,
		color:obj.panel_style.button_area_shadow_color,border_width:-shadow_size,round:shadow_size,
	})
	UI.PopCliprect();
	buttons.push({id:"$add",no_click_selection:1,special:'add',h:obj.panel_style.h_button});
	var had_cell_list=!!obj.cell_list;
	var cell_list_attrs={
		x:obj.x,y:obj.y,w:w_buttons,h:obj.h,
		dimension:'y',no_listview_region:0,no_region:1,//no_clipping:1,
		has_scroll_bar:0,
		mouse_wheel_speed:80,
		value:obj.m_last_focus_cell_id>>1,
		OnChange:function(value){
			value=Math.min(value,obj.m_cells.length-1);
			W.ListView_prototype.OnChange.call(this,value);
			obj.m_last_focus_cell_id=value*2;
			UI.Refresh();
		},
		item_template:{
			object_type:W.CellCaption,
			owner:obj,
		},items:buttons};
	if(!had_cell_list){
		cell_list_attrs.position=obj.m_cell_list_old_position;
	}
	W.ListView('cell_list',cell_list_attrs);
	obj.m_cell_list_old_position=undefined;
	if(obj.m_sel_rendering_y!=undefined&&obj.m_caption_dragged||!had_cell_list){
		var pos0=(obj.cell_list.position||0);
		obj.cell_list.AutoScroll();
		if(pos0!=obj.cell_list.position){
			if(!had_cell_list){
				UI.InvalidateCurrentFrame();
			}
			UI.Refresh();
		}
	}
	if(!had_cell_list){
		if(obj.m_set_focus_cell_list){
			UI.SetFocus(obj.cell_list);
			obj.m_set_focus_cell_list=0;
			UI.InvalidateCurrentFrame();
			UI.Refresh();
		}
	}
	UI.End()
	if(UI.enable_timing){
		UI.TimingEvent("leaving NotebookView");
	}
	//CellCaption
	return obj
}

var SetCellRunTag=function(doc,s_text){
	var lang=doc.plugin_language_desc
	var sel=doc.GetSelection();
	var line0=doc.GetLC(sel[0])[0];
	var line1=doc.GetLC(sel[1])[0];
	var cmt_holder=lang;
	if(lang.GetCommentStrings){
		cmt_holder=lang.GetCommentStrings(doc.ed.GetStateAt(doc.ed.m_handler_registration["colorer"],sel[0],"ill")[0]);
	}
	var s_check=doc.ed.GetText(0,Math.min(doc.ed.GetTextSize(),4096));
	var match=s_check.match(/(\[new window\])|(\[new term\])|(\[interactive\])|(\[simple\])/);
	var ccnt=0,sz=0;
	if(match){
		ccnt=Duktape.__byte_length(s_check.substr(0,match.index))
		sz=Duktape.__byte_length(match[0]);
	}else{
		s_text=(s_text?(cmt_holder&&cmt_holder.line_comment||"#")+s_text+"\n":"");
		var pline=s_check.indexOf('\n');
		if(pline>0){
			ccnt=Duktape.__byte_length(s_check.substr(0,pline+1));
		}else{
			ccnt=doc.ed.GetTextSize();
			s_text='\n'+s_text;
		}
	}
	doc.HookedEdit([ccnt,sz,s_text]);
	doc.CallOnChange();
	UI.Refresh()
};

UI.BringUpNotebookTab=function(file_name,mode){
	//var file_name=fname0||IO.GetNewDocumentName("new","txt","document")
	file_name=IO.NormalizeFileName(file_name);
	for(var i=0;i<UI.g_all_document_windows.length;i++){
		var obj_tab_i=UI.g_all_document_windows[i];
		if(obj_tab_i.file_name==file_name&&obj_tab_i.document_type=="notebook"){
			if(mode=="focus"){
				UI.top.app.document_area.SetTab(i)
			}else if(mode=="bringup"){
				UI.top.app.document_area.BringUpTab(i)
			}else{
				//nothing
			}
			return obj_tab_i;
		}
	}
	return null;
};
UI.OpenNoteBookTab=function(file_name,is_quiet){
	var layout=UI.m_ui_metadata["<layout>"];
	layout.m_is_maximized=0;
	file_name=IO.NormalizeFileName(file_name);
	var obj_ret=UI.BringUpNotebookTab(file_name,is_quiet?"none":"focus");
	if(obj_ret){return obj_ret;}
	var spath=UI.GetPathFromFilename(file_name);
	var is_default=(spath==IO.NormalizeFileName(IO.GetStoragePath()));
	UI.top.app.quit_on_zero_tab=0;
	var bk_current_tab_id=undefined;
	if(is_quiet){
		bk_current_tab_id=UI.top.app.document_area.current_tab_id;
	}
	var ret=UI.NewTab({
		file_name:file_name,
		is_default:is_default,
		title:is_default?UI._("Default Notebook"):UI.Format("@1 - Notebook",UI.GetMainFileName(UI.GetPathFromFilename(file_name)),"Notebook"),
		tooltip:file_name,
		document_type:"notebook",
		area_name:"v_tools",
		NeedRendering:function(){
			if(!this.main_widget){return 1;}
			if(this==UI.top.app.document_area.active_tab){return 1;}
			var body=this.main_widget;
			for(var i=0;i<body.m_cells.length;i++){
				if(body.m_cells[i].m_proc){
					return 1;
				}
				var obj0=body["doc_in_"+i.toString()];
				var obj1=body["doc_out_"+i.toString()];
				if(obj0&&!obj0.m_is_rendering_good){return 1;}
				if(obj1&&!obj1.m_is_rendering_good){return 1;}
			}
			return 0;
		},
		UpdateTitle:function(){
			if(this.main_widget){
				var body=this.main_widget;
				var s_name=this.is_default?UI._("Default Notebook"):UI.GetMainFileName(UI.GetPathFromFilename(this.file_name));
				var is_running=0;
				var s_progress=undefined;
				for(var i=0;i<body.m_cells.length;i++){
					if(body.m_cells[i].m_proc){
						is_running=1;
						if(s_progress==undefined){
							var progress=body.m_cells[i].m_proc.m_term.progress_value;
							if(progress>=0){
								s_progress=(progress*100.0).toFixed(1);
							}
						}
					}
				}
				if(is_running){
					if(UI.top.app.progress==undefined&&s_progress!=undefined){
						UI.top.app.progress=parseFloat(s_progress)/100;
					}
					if(s_progress!=undefined){
						this.title=UI.Format("@1 (@2%)",s_name,s_progress)+((this.need_save&3)?'*':'');
					}else{
						this.title=UI.Format("@1 (running)",s_name)+((this.need_save&3)?'*':'');
					}
				}else{
					this.title=(this.is_default?UI._("Default Notebook"):UI.Format("@1 - Notebook",s_name))+((this.need_save&3)?'*':'');
				}
				this.tooltip=this.file_name;
			}
		},
		body:function(){
			//use styling for editor themes
			UI.context_parent.body=this.main_widget;
			if(this.main_widget){this.file_name=this.main_widget.file_name}
			var attrs={
				'anchor':'parent','anchor_align':"fill",'anchor_valign':"fill",
				'x':0,'y':0,
				'file_name':this.file_name,
				'is_default':this.is_default,
				'activated':this==UI.top.app.document_area.active_tab,
			};
			var body=W.NotebookView("body",attrs)
			if(!this.main_widget){
				this.main_widget=body;
			}
			this.need_save=this.main_widget.need_save;
			if(this.is_default&&this.need_save){
				this.need_save=65536;
			}
			this.UpdateTitle();
			//var s_name=UI.GetMainFileName(UI.GetPathFromFilename(this.file_name));
			//var is_running=0;
			//for(var i=0;i<body.m_cells.length;i++){
			//	if(body.m_cells[i].m_proc){
			//		is_running=1;
			//		break
			//	}
			//}
			//if(is_running){
			//	body.title=UI.Format("@1 (running)",s_name)+(this.need_save?'*':'');
			//}else{
			//	body.title=UI.Format("@1 - Notebook",s_name)+(this.need_save?'*':'');
			//}
			//body.tooltip=this.file_name;
			return body;
		},
		NeedMainWidget:function(){
			if(!this.main_widget){
				this.main_widget=Object.create(W.notebook_prototype);
				this.main_widget.panel_style=UI.default_styles.notebook_view_v2.panel_style;
				this.main_widget.file_name=this.file_name;
			}
			if(!this.main_widget.m_cells){
				this.main_widget.Load();
			}
		},
		Save:function(){
			if(!this.main_widget){return;}
			if(this.main_widget.file_name&&this.main_widget.file_name.indexOf('<')>=0){
				this.SaveAs()
				return
			}
			this.main_widget.Save();
			this.need_save=this.main_widget.need_save;
			if(this.is_default&&this.need_save){
				this.need_save=65536;
			}
		},
		SaveAs:function(){
			if(!this.main_widget){return;}
			var fn=IO.DoFileDialog(1,"json",
				this.main_widget.file_name.indexOf('<')>=0?
					UI.m_new_document_search_path:
					UI.GetPathFromFilename(this.main_widget.file_name));
			if(!fn){return;}
			this.file_name=fn
			this.main_widget.file_name=fn
			this.Save()
		},
		SaveMetaData:function(){
			if(this.main_widget){this.main_widget.SaveMetaData();}
		},
		OnDestroy:function(){
			if(this.main_widget){this.main_widget.OnDestroy();}
		},
		Reload:function(){
			if(this.main_widget){this.main_widget.Reload();}
		},
		OnTabClose:function(){
			if(this.main_widget){
				var body=this.main_widget;
				var is_running=0;
				for(var i=0;i<body.m_cells.length;i++){
					if(body.m_cells[i].m_proc){
						is_running=1;
						break;
					}
				}
				if(is_running){
					this.in_save_dialog=1;
					this.save_dialog_desc={
						text:UI._("It's still running..."),
						buttons:[{
							text:UI._("Stop it"),is_good:1,
							hotkeys:["K","Y","RETURN","SPACE"],
							std_action:"close",
							OnClick:function(){
								for(var j=0;j<body.m_cells.length;j++){
									body.KillCell(j);
								}
							},
						},{
							text:UI._("Cancel"),
							hotkeys:["N","C","ESC"],
							std_action:"cancel",
						}]};
					return 0;
				}
			}
			return 1;
		},
	})
	if(is_quiet){
		UI.top.app.document_area.current_tab_id=bk_current_tab_id;
	}
	return ret;
};

///////////////////////////////////
//terminal
W.terminal_prototype={
	//nothing for now
};
W.Terminal=function(id,attrs){
	var obj=UI.StdWidget(id,attrs,"terminal",W.terminal_prototype);
	UI.Begin(obj)
	if(!obj.m_term){
		if(!UI.InitTerminal(obj,obj.cols,obj.rows,obj.args,obj.spath,function(){
			this.terminated=1;
			UI.Refresh();
		}.bind(obj))){
			//no need to poll anything
			//obj.m_term="bad";
			//obj.Render=function(){
			//	//do nothing
			//}
		}
	}
	W.PureRegion(id,obj);
	UI.PushCliprect(obj.x,obj.y,obj.w,obj.h);
	UI.RoundRect({
		x:obj.x,y:obj.y,w:obj.w,h:obj.h,
		color:obj.panel_style.bgcolor,
	})
	var dims=UI.MeasureText(UI.default_styles.terminal.font,' ');
	var w_term=obj.m_term.cols*dims.w;
	var h_term=obj.m_term.rows*dims.h;
	var value=obj.GetScrollValue();
	var w_term_area=w_term+(value>=0?obj.w_scroll_bar:0);
	var scale=Math.min(Math.min(obj.w/w_term_area,obj.h/h_term),1);
	obj.font=UI.ScaleFont(UI.default_styles.terminal.font,scale);
	w_term*=scale;
	h_term*=scale;
	w_term_area*=scale;
	var x_term=obj.x+(obj.w-w_term_area)*0.5;
	var y_term=obj.y+(obj.h-h_term)*0.5;
	UI.RoundRect({
		x:x_term-obj.panel_style.shadow_size,y:y_term-obj.panel_style.shadow_size,
		w:w_term_area+obj.panel_style.shadow_size*2,h:h_term+obj.panel_style.shadow_size*2,
		color:obj.panel_style.shadow_color,
		border_width:-obj.panel_style.shadow_size,
		round:obj.panel_style.shadow_size,
	});
	var in_bell=obj.m_term.isInBell();
	var C_bell=UI.lerp_rgba(obj.panel_style.bell_color&0xffffff,obj.panel_style.bell_color,Math.min(Math.max(in_bell,0.0),1.0));
	UI.RoundRect({
		x:x_term-obj.panel_style.border_width,y:y_term-obj.panel_style.border_width,
		w:w_term_area+obj.panel_style.border_width*2,h:h_term+obj.panel_style.border_width*2,
		color:obj.panel_style.border_color,
		round:obj.panel_style.border_width,
		border_color:C_bell,
		border_width:in_bell?obj.panel_style.bell_border_width:0,
	});
	if(in_bell){
		UI.AutoRefresh();
	}
	UI.PushCliprect(x_term,y_term,w_term_area,h_term);
	obj.Render(x_term,y_term,w_term,h_term);
	if(value>=0){
		W.ScrollBar("sbar",{
			x:x_term+w_term, y:y_term, w:obj.w_scroll_bar, h:h_term, dimension:'y',
			page_size:obj.m_term.rows, total_size:obj.m_term.n_valid_lines-obj.m_term.rows, value:value,
			OnChange:function(value){
				obj.SetScrollValue(value)
				UI.Refresh()
			},
		});
	}
	UI.PopCliprect();
	//if(UI.HasFocus(obj)){
	//	W.Hotkey("",{key:"CTRL+D",action:function(){
	//		obj.Download("c:/users/hqm/downloads/icon1k.png","icon1k.png");
	//	}});
	//}
	UI.PopCliprect();
	//a terminal menu - standard scripts, "first command" history
	if(obj.activated){
		var menu_terminal=undefined;
		menu_terminal=UI.BigMenu("Ter&minal");
		menu_terminal.AddNormalItem({
			text:"Install remote editing feature",
			icon:"远",
			action:function(){
				var s_script=IO.UIReadAll('res/misc/qpad.sh');
				//var s_send=['STTY_STATE=`stty -g`;stty raw -echo;(head -c ',
				//	Duktape.__byte_length(s_script).toString(),
				//'|sh);stty "${STTY_STATE}";source ~/.profile\r',s_script].join('');
				//obj.m_term.send(s_send);
				obj.m_term.send(s_script);
				UI.Refresh()
			}})
		var s_ssh_command=(obj.ssh_command||obj.m_term.last_ssh_command);
		if(s_ssh_command&&UI.DetectMSYSTools()){
			menu_terminal.AddNormalItem({
				text:UI.Format("Pin '@1' to this menu",s_ssh_command),
				action:function(s_ssh_command){
					var pinned_terms=UI.m_ui_metadata["<pinned_terminals>"];
					if(!pinned_terms){
						pinned_terms=[];
						UI.m_ui_metadata["<pinned_terminals>"]=pinned_terms;
					}
					pinned_terms.push(s_ssh_command);
					UI.Refresh();
				}.bind(null,s_ssh_command)
			});
		}
		menu_terminal=undefined;
	}
	UI.End();
	return obj;
};

UI.OpenTerminalTab=function(options){
	UI.top.app.quit_on_zero_tab=0;
	var ret=UI.NewTab({
		file_name:'<terminal>',
		title:UI._("Terminal"),
		//tooltip:file_name,
		document_type:"terminal",
		area_name:"doc_default",
		//area_name:UI.IS_MOBILE?"doc_default":"terminals",
		UpdateTitle:function(){
			var title=UI._("Terminal");
			if(this.main_widget){
				title=(this.main_widget.GetTitle()||title);
				if(this.main_widget.terminated){
					title=UI.Format("@1 (stopped)",title);
				}else{
					var progress=this.main_widget.m_term.progress_value;
					if(progress>=0&&progress<=1){
						title=UI.Format("@1 (@2%)",title,(progress*100.0).toFixed(1));
					}
				}
			}
			this.title=title;
		},
		body:function(){
			//frontmost doc
			UI.context_parent.body=this.main_widget;
			var had_body=!!this.main_widget;
			var body=W.Terminal('body',{
				'anchor':'parent','anchor_align':'fill','anchor_valign':'fill',
				'file_name':'<terminal>',
				'x':0,'y':0,
				'args':options.args,
				'spath':options.spath,
				'cols':options.cols,
				'rows':options.rows,
				'ssh_command':options.ssh_command,
				'activated':this==UI.top.app.document_area.active_tab,
				'default_focus':1,
			});
			if(!had_body){
				UI.SetFocus(body);
			}
			if(body.terminated&&options.auto_close){
				UI.m_invalid_util_tabs.push(this.__global_tab_id);
			}
			this.main_widget=body;
			return body;
		},
		OnTabClose:function(){
			if(this.main_widget){
				var body=this.main_widget;
				if(!body.terminated){
					this.in_save_dialog=1;
					this.save_dialog_desc={
						text:UI._("It's still connected..."),
						buttons:[{
							text:UI._("Hang up"),is_good:1,
							hotkeys:["K","Y","RETURN","SPACE"],
							std_action:"close",
							OnClick:function(){
								//console.log('body.Terminate();');
								body.Terminate();
							},
						},{
							text:UI._("Cancel"),
							hotkeys:["N","C","ESC"],
							std_action:"cancel",
						}]};
					return 0;
				}
			}
			return 1;
		},
		NeedRendering:function(){
			if(this.main_widget){
				return this.main_widget.NeedUpdate();
			}else{
				return 1;
			}
		},
		//Save:function(){},
		//SaveMetaData:function(){},
		OnDestroy:function(){
			var obj=this.main_widget;
			if(obj&&obj.m_term.compiler_errors){
				for(var i=0;i<obj.m_term.compiler_errors.length;i++){
					ClearCompilerError(obj.m_term.compiler_errors[i]);
				}
				UI.RefreshAllTabs();
			}
			this.main_widget.m_term.destroy();
			this.main_widget.m_term=undefined;
			this.main_widget=undefined;
		},
	})
	return ret;
};

UI.ParseTerminalOutput=function(term,sline,is_clicked){
	if(term.got_enter_from_input){
		if(term.compiler_errors){
			for(var i=0;i<term.compiler_errors.length;i++){
				ClearCompilerError(term.compiler_errors[i]);
			}
			term.compiler_errors=undefined;
			UI.RefreshAllTabs();
		}
		term.got_enter_from_input=0
	}
	var err=UI.ParseCompilerOutput(sline);
	if(err){
		var fn_raw=err.file_name;
		//if(!(fn_raw.search(g_regexp_abspath)>=0)&&!IO.FileExists(fn_raw)){
		if(!IO.FileExists(fn_raw)){
			var fn_search_found=UI.SearchIncludeFile((term.m_current_path||'.')+'/'+fn_raw,fn_raw);
			if(!fn_search_found){
				fn_raw=UI.RemovePath(fn_raw);
				fn_search_found=UI.SearchIncludeFile((term.m_current_path||'.')+'/'+fn_raw,fn_raw);
			}
			err.file_name=IO.NormalizeFileName((fn_search_found||((term.m_current_path||'.')+'/'+err.file_name)));
		}
		if(is_clicked){
			//do not create a new highlight for the error, but noisily focus it
			err.is_quiet=1;
			CreateCompilerError(err,"click");
		}else if(!err.is_quiet){
			CreateCompilerError(err);
			if(term.compiler_errors==undefined){
				term.compiler_errors=[];
			}
			term.compiler_errors.push(err);
		}
		UI.RefreshAllTabs();
		return 1;
	}else{
		return 0;
	}
};

var ReallyDetectMSYSTools=function(){
	if(UI.IS_MOBILE){return 0;}
	if(UI.Platform.ARCH=="win32"||UI.Platform.ARCH=="win64"){
		var paths=IO.ProcessUnixFileName("%PATH%").split(/[; \t]/);
		var got_script=0;
		var got_stty=0;
		var got_bash=0;
		for(var i=0;i<paths.length;i++){
			var path_i=paths[i];
			if(!got_script&&IO.FileExists(path_i+"\\script.exe")){
				got_script=1;
			}
			if(!got_stty&&IO.FileExists(path_i+"\\stty.exe")){
				got_stty=1;
			}
			if(!got_bash&&IO.FileExists(path_i+"\\bash.exe")){
				got_bash=1;
			}
		}
		return (got_script&&got_stty&&got_bash);
	}else{
		return 1;
	}
};

UI.DetectMSYSTools=function(){
	if(UI.m_has_unix_tools==undefined){
		UI.m_has_unix_tools=ReallyDetectMSYSTools();
	}
	return UI.m_has_unix_tools;
};

UI.RegisterSpecialFile("remote",{
	GetDisplayName:function(obj_widget){
		return obj_widget&&obj_widget.doc&&(UI.Format("@1 (remote)",obj_widget.doc.m_fn_remote));
	},
	Load:function(obj_widget){
		return '';
	},
	Save:function(s_content,obj_widget){
		var doc=obj_widget.doc;
		if(!doc.m_linked_terminal.writable){return;}
		var s_final='s'+Duktape.__byte_length(s_content).toString()+';'+s_content;
		doc.m_upload_size=Duktape.__byte_length(s_final);
		doc.m_linked_terminal.setRemoteSavingCallback(function(n_queued){
			if(!n_queued){
				obj_widget.CreateNotification({id:'saving_progress',text:"Waiting for response..."})
				return;
			}
			if(n_queued<0){
				this.owner.DismissNotification('saving_progress');
				doc.m_linked_terminal.setRemoteSavingCallback(null);
				this.ed.saving_context=undefined;
				return;
			}
			this.owner.CreateNotification({id:'saving_progress',text:UI.Format("Uploading @1%...",((this.m_upload_size-n_queued)/this.m_upload_size*100).toFixed(0))})
		}.bind(doc));
		doc.ed.saving_context={/*nothing*/};
		obj_widget.CreateNotification({id:'saving_progress',text:"Uploading to the terminal..."})
		doc.m_linked_terminal.send(s_final)
	},
	plugin:function(){
		this.AddEventHandler('close',function(){
			if(this.m_linked_terminal){
				this.m_linked_terminal.send('q');
			}
		});
		this.AddEventHandler('menu',function(){
			if(this.m_linked_terminal&&!this.m_linked_terminal.writable){
				if(this.owner){
					this.owner.CreateNotification({id:'saving_progress',icon:'警',text:"THE TERMINAL HAS BEEN CLOSED!\nCan't upload anymore. Save your changes under another name before it's lost."})
				}
				this.saved_point=-1;
				this.m_file_name='<lost file>';
				this.owner.file_name=this.m_file_name;
				UI.Refresh();
			}
		});
	},
});

UI.OpenRemoteEditorTab=function(terminal,fn){
	var tab=UI.OpenEditorWindow("*remote",function(){
		this.m_linked_terminal=terminal;
		this.m_fn_remote=fn;
		this.ed.hfile_loading={
			progress:0,
			discard:function(){},
		};
		terminal.setRemoteLoadingCallback(function(s_content,progress,is_done){
			if(this.m_is_destroyed){return 0;}
			if(s_content){
				this.ed.Edit([this.ed.GetTextSize(),0,s_content],1);
			}
			if(is_done){
				this.ed.hfile_loading=undefined;
			}else{
				this.ed.hfile_loading.progress=progress;
			}
			return 1;
		}.bind(this));
	});
	tab.m_fn_remote=fn;
};
