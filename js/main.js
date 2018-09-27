var repo = new EcRepository();
repo.selectedServer = "https://dev.cassproject.org/api/";
EcRepository.caching = true;
EcIdentityManager.readIdentities();

$(document).ready(function () {

    $("iframe").ready(function () {
        $(window).on("message", function (event) {
            if (event.originalEvent.data.message == "waiting") {
                //Identity
                $("iframe")[0].contentWindow.postMessage(JSON.stringify({
                    action: "identity",
                    identity: EcIdentityManager.ids[0].ppk.toPem()
                }), window.location.origin);
            };
        });
    });

    $("#rad4").change(function (evt) {
        if ($("#rad4:checked").length > 0)
            $("#viewOutputFramework").attr("src", "cass-editor/index.html?server=" + repo.selectedServer + "&user=wait&origin=" + window.location.origin);
        else
            $("#viewOutputFramework").attr("src", "");
    });

});
