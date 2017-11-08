"use strict"

!async function ()
{
    /**
     * @param {string} method
     * @param {any[]} args
     */
    function payload(method, ...args)
    {
        return { "action": "analyse", "method": method, "argument": args };
    }

    /**
     * @param {number | number[]} ids
     * @param {"Answer" | "Article"} target
     * @returns {BagArray}
     */
    async function getVoters(ids, target)
    {
        const method = target === "Answer" ? "getAnsVoters" : "getArtVoters";
        const voters = await SendMsgAsync(payload(method, ids));
        console.log("voters", voters);
        return voters;
    }

    /**
     * @param {string[] | string | BagArray} voters
     */
    async function AssocByVoters(voters)
    {
        const anss = await SendMsgAsync(payload("getAnswerByVoter", voters, "desc"));
        console.log(anss);
        const ansMap = await SendMsgAsync(payload("getPropMapOfIds", "answers", anss.mapToProp("key"), "question"));
        const qstMap = await SendMsgAsync(payload("getDetailMapOfIds", "questions", Object.values(ansMap), "id"));
        const data = [];
        for (let idx = 0; idx < anss.length; ++idx)
        {
            const cur = anss[idx];
            const qstid = ansMap[cur.key];
            const link = "https://www.zhihu.com/question/" + qstid + "/answer/" + cur.key;
            const qst = qstMap[qstid];
            const title = qst == null ? qstid : qst.title;
            const dat = { "ansid": cur.key, "qst": { "title": title, "link": link }, "times": cur.count };
            data.push(dat);
        }

        $("#maintable").DataTable(
            {
                paging: true,
                lengthMenu: [[20, 50, 100, -1], [20, 50, 100, "All"]],
                data: data,
                order: [[2, "desc"]],
                columns: [
                    { data: "ansid" },
                    {
                        data: "qst",
                        render: function (data, type, row)
                        {
                            if (type === 'display')
                                return '<a href="' + data.link + '">' + data.title + '</a>';
                            else
                                return data.link;
                        }
                    },
                    { data: "times" }
                ]
            });
    }

    /**@type {{[x: string]: string}}*/
    const qs = _getQueryString();

    let voters;

    if (qs.artid != null)
    {
        const artid = qs.artid.includes("*") ? qs.artid.split("*").map(Number) : Number(qs.artid);
        voters = await getVoters(artid, "Article");
    }
    else if (qs.votid != null)
    {
        voters = qs.votid.includes("*") ? qs.votid.split("*") : qs.votid;
    }
    else
    {
        /**@type {number[] | number}*/
        let ansid;
        if (qs.ansid != null)
        {
            if (qs.ansid.includes("*"))
                ansid = qs.ansid.split("*").map(Number);
            else
                ansid = Number(qs.ansid);
        }
        else if (qs.authorid != null)
        {
            const athid = qs.authorid.includes("*") ? qs.authorid.split("*") : qs.ansid;
            ansid = (await SendMsgAsync(payload("getAnswerByVoter", athid))).mapToProp("key");
        }
        else
            return;
        voters = await getVoters(ansid, "Answer");
    }
    if (voters != null)
        AssocByVoters(voters);
}()