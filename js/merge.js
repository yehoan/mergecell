(function ($) {
    $.fn.extend({
        //第一次初始化
        firstInit: function () {
            return this.each(function () {
                var t = $(this);
                t.addClass("table");
                initTable(t, {row: 10, col: 10, width: 0, type: 1})
            })
        },
        //更新页面
        getExcelHtml: function () {
            var table = $(this).find("table").first();
            var clone = table.clone(false);
            clone.find("tr:eq(0)").remove();
            clone.find("tr").find("td:eq(0)").remove();
            clone.find("td[class='']").removeAttr("class")
            return clone.prop("outerHTML")
        },
    });

    //初始化table
    function initTable(t, setting) {
        t.empty();
        var table;
        table = $("<table width='100%'></table>").appendTo(t);
        for (var i = 0; i < setting.row; i++) {
            var tr = $("<tr></tr>").appendTo(table);
            for (var j = 0; j < setting.col; j++) {
                $("<td></td>").appendTo(tr)
            }
        }
        drawDrugArea(table);
        eventBind(table, t);
        //阻止默认行为
        t.unbind("contextmenu");
        t.on('contextmenu', function () {
            return false
        })
    }
    //绑定点击事件
    function eventBind(table, t) {
        table.mousedown(function (e) {
            if (e.button != 2) {
                table.find("td").removeClass("td-chosen-css");  //td-chosen-css  给区域内的加css
                table.removeData("beg-td-ele");
                table.data("beg-td-ele", $(e.target))
            }
        }).mouseup(function (e) {
            if (e.button == 2) {
                showRightPanel(table, t, e)
            } else {
                closeRightPanel(t);
                var ele = $(e.target)
                clearPositionCss(table);
                getChosenList(table, getTdPosition(table.data("beg-td-ele")), getTdPosition(ele))
                drawChosenArea(table, t)
            }
        });
    }
    //获取选择列表
    function getChosenList(table, begPosi, endPosi) {
        console.log(begPosi, endPosi, '开始是i11')
        if (begPosi != undefined && endPosi != undefined) {
            var coll = [];
            //开始位置由用户决定
            for (var i = (begPosi.row > endPosi.row ? endPosi.row : begPosi.row); i <= (begPosi.row > endPosi.row ? begPosi.row : endPosi.row); i++) {
                var tr = table.find("tr:eq(" + i + ")");
                for (var j = (begPosi.col > endPosi.col ? endPosi.col : begPosi.col); j <= (begPosi.col > endPosi.col ? begPosi.col : endPosi.col); j++) {
                    var td = tr.find("td:eq(" + j + ")");
                    td.addClass("td-chosen-css");
                }
            }
            var coll = table.find(".td-chosen-css");
            var firstPosi = getTdPosition($(coll.get(0)));
            var beg_row = firstPosi.row;
            var beg_col = firstPosi.col;
            table.find("td").removeData("add-chosen-state").removeData("get-father-state");
            while (true) {
                var end_row = 0;
                var end_col = 0;
                var con = false;
                coll.each(function () {
                    var p = getTdPosition($(this));
                    var r = p.row + (Number($(this).attr("rowspan")) - 1);
                    var c = p.col + (Number($(this).attr("colspan")) - 1);
                    end_row = end_row < r ? r : end_row;
                    end_col = end_col < c ? c : end_col;
                    beg_row = beg_row > p.row ? p.row : beg_row;
                    beg_col = beg_col > p.col ? p.col : beg_col
                });
                for (var i = beg_row; i <= end_row; i++) {
                    var tr = table.find("tr:eq(" + i + ")");
                    for (var j = beg_col; j <= end_col; j++) {
                        var dt = tr.find("td:eq(" + j + ")");
                        if (!dt.hasClass("td-chosen-css")) {
                            dt.addClass("td-chosen-css");
                            coll = table.find(".td-chosen-css");
                            con = true
                        }
                    }
                }
                if (!con) {
                    break
                }
            }
            return coll
        }
    }

    //获取table 位置
    function getTdPosition(td) {
        var table = td.closest("table");
        var pos = {};
        var tr = td.closest("tr");
        pos.row = table.find("tr").index(tr);
        pos.col = tr.find("td").index(td);
        return pos
    }
    //合并
    function mergeCell(table) {
        if (table.length == 1) {
            var coll = table.find(".td-chosen-css");
                var fir = $(coll.get(0));
                var posi = getTdPosition(fir);
                var r = 0, c = 0;
                if (fir.attr("rowspan") != undefined && fir.attr("colspan") != undefined) {
                    r = Number(fir.attr("rowspan")) - 1;
                    c = Number(fir.attr("colspan")) - 1
                }
                coll.each(function () {
                    var p = getTdPosition($(this));
                    r = (p.row - posi.row) > r ? p.row - posi.row : r;
                    c = (p.col - posi.col) > c ? (p.col - posi.col) : c;
                    if (!$(this).is(fir)) {
                        $(this).removeClass("td-chosen-css").css("display", "none");
                        if ($(this).attr("rowspan") != undefined && $(this).attr("colspan") != undefined) {
                            r = (p.row + (Number($(this).attr("rowspan")) - 1) - posi.row) > r ? (p.row + (Number($(this).attr("rowspan")) - 1) - posi.row) : r;
                            c = (p.col + (Number($(this).attr("colspan")) - 1) - posi.col) > c ? (p.col + (Number($(this).attr("colspan")) - 1) - posi.col) : c
                        }
                    }
                });
                $(coll.get(0)).attr("rowspan", r + 1).attr("colspan", c + 1).css("display", "")
            }
    }
    //拖拽选择区域
    function drawChosenArea(table, t) {
        var coll = table.find(".td-chosen-css");
        table.find("td").removeClass("td-chosen-muli-css");
        //选择区域大于0
        if (coll.length > 0) {
            var first = coll.first();
            var posi = getTdPosition(first);
            var width = 0, height = 0;
            var p = table.parent();
            coll.each(function () {
                var p = getTdPosition($(this));
                if (p.row == posi.row) {
                    width += this.offsetWidth
                }
                if (p.col == posi.col) {
                    height += this.offsetHeight
                }
            });
            if (coll.length > 1) {
                coll.addClass("td-chosen-muli-css");
            }
            p.find(".chosen-area-p").remove();
        }
    }
    //描绘区域
    function drawDrugArea(table) {
        var ind = 0;
        table.find("tr").first().find("td:gt(0)").unbind("click");
        table.find("tr").find("td:eq(0)").unbind("click");
        table.find("tr").first().find("td:gt(0)").each(function () {
            var char = String.fromCharCode(65 + ind);
            if (ind >= 26) {
                char = String.fromCharCode(65 + (parseInt(ind / 26) - 1)) + String.fromCharCode(65 + ind % 26)
            }
            $(this).addClass("drug-ele-td").css("text-align", "center").html(char);
            ind++
        });
        ind = 0;
        table.find("tr").find("td:eq(0)").each(function () {
            $(this).width(50).addClass("drug-ele-td").css("text-align", "center").html(ind == 0 ? "" : ind);
            ind++
        });
    }
    // 去除css
    function clearPositionCss(table) {
        table.find("td").removeClass("td-position-css")
    }
    //显示右边栏
    function showRightPanel(table, t, e) {
        closeRightPanel(t);
        var rightMousePanel = $("<div class='rightmouse-panel-div'></div>").css("left", e.clientX).css("top", e.clientY).insertBefore(table);
        $("<div class='wb hebingdanyuange'></div>").html("<span class='excel-rightmomuse-icon-css'></span><span class='excel-rightmomuse-text-css'>合并单元格</span>").appendTo(rightMousePanel);
        rightMousePanel.find(".wb").click(function () {
            recordData(t)
            mergeCell(table)
            rightMousePanel.remove()
        });
    }
    //关闭右侧菜单
    function closeRightPanel(t) {
        t.find(".rightmouse-panel-div").remove()
    }
    //重置数据
    function recordData(t) {
        var record = [];
        record[record.length] = t.getExcelHtml();
        t.data("record", record)
    }
})(jQuery);