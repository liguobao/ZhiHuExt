"use strict"

!function ()
{
    console.log("people page");
    function rootFinder(records)
    {
        for (let i = 0; i < records.length; ++i)
        {
            const record = records[i];
            if (record.type != "childList")
                continue;
            const nodes = record.addedNodes;
            for (let j = 0; j < nodes.length; ++j)
            {
                const node = nodes[j];
                if (!(node instanceof Element))
                    continue;
                if (node.id === "data")
                    return node;
                const obj = node.querySelector("#data");
                if (obj)
                    return obj;
            }
        }
        return null;
    }
    const obs = new MutationObserver(records =>
    {
        const obj = rootFinder(records);
        if (!obj)
            return;
        obs.disconnect();
        const state = JSON.parse(obj.dataset.state);
        console.log(state);
        {
            const entities = APIParser.parseEntities(state.entities);
            ContentBase._report("batch", entities);
            console.log(entities);
            //process user
            const selfUser = state.currentUser;
            ContentBase.CUR_USER = entities.users.filter(u => u.id === selfUser)[0]
            console.log(ContentBase.CUR_USER);
        }
    });
    obs.observe(document, { "childList": true, "subtree": true });

    setTimeout(() =>
    {
        const user = ContentBase.CUR_USER;
        const header = $("#ProfileHeader")[0];
        if (!user || !header)
            return;
        const btn = createButton(["Btn-ReportSpam", "Button--primary"], "广告");
        btn.dataset.id = user.id;
        btn.dataset.type = "member";
        $(".ProfileButtonGroup", header).prepend(btn);
    }, 640);
}()
