var UI=require("gui2d/ui");
var W=require("gui2d/widgets");

UI.RegisterEditorPlugin(function(){
	//enhanced enter
	this.AddEventHandler('\n',function(){
		var ed=this.ed;
		var ccnt=this.GetSelection()[0]
		var ccnt_ehome=Math.min(this.GetEnhancedHome(ccnt),ccnt)
		var ccnt_lhome=this.SeekLC(this.GetLC(ccnt_ehome)[0],0)
		if(!(ccnt_ehome>ccnt_lhome)){return 1;}//don't intercept it
		this.OnTextInput({"text":"\n"+this.ed.GetText(ccnt_lhome,ccnt_ehome-ccnt_lhome),"is_paste":1})
		return 0;
	})
});

UI.RegisterEditorPlugin(function(){
	//tab indent, shift+tab dedent
	if(!this.tab_is_char){return;}
	var indentText=function(delta){
		var ed=this.ed;
		var sel=this.GetSelection();
		if(sel[0]==sel[1]){return 1;}
		var line0=this.GetLC(sel[0])[0];
		var line1=this.GetLC(sel[1])[0];
		if(this.SeekLC(line1,0)<sel[1]){line1++;}
		var line_ccnts=this.SeekAllLinesBetween(line0,line1+1);
		var ops=[];
		for(var i=0;i<line_ccnts.length-1;i++){
			var ccnt0=line_ccnts[i];
			var ccnt1=line_ccnts[i+1];
			if(delta>0){
				ops.push(ccnt0,0,'\t')
			}else{
				if(ccnt0<ccnt1){
					var ch=ed.GetUtf8CharNeighborhood(ccnt0)[1];
					if(ch==32||ch==9){
						ops.push(ccnt0,1,null)
					}
				}
			}
		}
		if(ops.length){
			this.HookedEdit(ops)
			this.CallOnChange()
			UI.Refresh();
			return 0;
		}else{
			return 1;
		}
	}
	this.AddEventHandler('TAB',function(){
		return indentText.call(this,1)
	})
	this.AddEventHandler('SHIFT+TAB',function(){
		return indentText.call(this,-1)
	})
})

UI.RegisterEditorPlugin(function(){
	//alt+pgup/pgdn
	if(this.plugin_class!="code_editor"){return;}
	this.m_outer_scope_queue=[]
	this.AddEventHandler('ALT+PGUP',function(){
		var ed=this.ed;
		var ccnt_new=this.FindOuterLevel(this.sel1.ccnt);
		if(ccnt_new>=0){
			this.m_outer_scope_queue.push(this.sel1.ccnt)
			this.sel0.ccnt=ccnt_new
			this.sel1.ccnt=ccnt_new
			this.AutoScroll("center_if_hidden");
			UI.Refresh()
			return 0;
		}
		return 1;
	})
	this.AddEventHandler('ALT+PGDN',function(){
		if(this.m_outer_scope_queue.length){
			var ccnt_new=this.m_outer_scope_queue.pop()
			this.sel0.ccnt=ccnt_new
			this.sel1.ccnt=ccnt_new
			this.AutoScroll("center_if_hidden");
			UI.Refresh()
			return 0;
		}
	})
	this.AddEventHandler('selectionChange',function(){
		this.m_outer_scope_queue=[];
	})
	//alt+up/down
	this.AddEventHandler('ALT+UP',function(){
		var ed=this.ed;
		var id_indent=ed.m_handler_registration["seeker_indentation"]
		var my_level=this.GetIndentLevel(this.sel1.ccnt);
		var ccnt_new=ed.FindNearest(id_indent,[my_level],"l",this.SeekLC(Math.max(this.GetLC(this.sel1.ccnt)[0]-1,0)),-1);
		if(ccnt_new>=0){
			this.sel0.ccnt=ccnt_new
			this.sel1.ccnt=ccnt_new
			this.AutoScroll("center_if_hidden");
			UI.Refresh()
			return 0;
		}
		return 1
	})
	this.AddEventHandler('ALT+DOWN',function(){
		var ed=this.ed;
		var id_indent=ed.m_handler_registration["seeker_indentation"]
		var my_level=this.GetIndentLevel(this.sel1.ccnt);
		var ccnt_new=ed.FindNearest(id_indent,[my_level],"l",this.SeekLC(this.GetLC(this.sel1.ccnt)[0]+1),1);
		if(ccnt_new>=0){
			this.sel0.ccnt=ccnt_new
			this.sel1.ccnt=ccnt_new
			this.AutoScroll("center_if_hidden");
			UI.Refresh()
			return 0;
		}
		return 1
	})
});

//todo: from deferred
