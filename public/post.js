$(document).ready(function() {
  function parseMssidn(n) {
        var strArray = n.split("");
        strArray[0] == "0" ? 
            strArray.splice(0, 1, "254") : 
            (strArray[0] == "+" ? strArray.splice(0,1) : strArray);
        
        return strArray.join("");
  }
  
  var defaultTimeout;
  function startCountdown() {
    alert("Countdown() fn @Test6")
    $(".processing span span").text("[" + defaultTimeout + "s]");
    var counter = setInterval(function() {
      defaultTimeout--;
      var parsedTime = (defaultTimeout < 10) ? "0" + defaultTimeout : defaultTimeout; 
      if(defaultTimeout>=0) {
        $(".processing span span").text("[" + parsedTime + "s]");
      } else {
        //console.log(defaultTimeout);
        $(".processing span span").text("");
        clearInterval(counter);
      }
    }, 1000);
  }
  
 $("#inputForm").submit(function() {
    $(".processing span").text("Processing");
    $(".processing i").show();
    /* Request Validation */
    var amnt = $(".amount").val();
    var number = $(".number").val();
    
    if(amnt.length !=0 && !(isNaN(amnt)) && amnt>0) {
      var regExPattern = /^(?:254|\+254|0)?(7(?:(?:[129][0-9])|(?:0[0-8])|(4[0-1]))[0-9]{6})$/;
      var isNumberValid = regExPattern.test(number);
      if(isNumberValid) {
        var data = {
          amnt: amnt,
          number: parseMssidn(number)
        }
        
        $.ajax({
          url: "https://ngbookstore.glitch.me/process",
          type: "POST",
          data: data,
          dataType: "json",
          async: true,
          beforeSend: function() {
            alert("beforeSend() @Test1");
            $(".overlay-wrapper").show();
            alert("Activated Overlay @Test2");
          },
          success:function(e) {
            alert("ajaxSuccess() @Test3");
            alert(JSON.stringify(e));
            if(e.status=="success") {
              var requestID = e.requestID;
              var listenerArgs = {
                "requestID": requestID
              };
              alert(JSON.stringify(listenerArgs)+"ConditionCheck @Test4");
              $(".processing span").html("Transaction Initiated. Make sure to authorize the Transaction. <br>"
                                         + "Processing <span></span>");
              alert("StartingCountdown() @Test5");
              /*Include TransactionProcessing CountDown*/
              defaultTimeout = 50;
              startCountdown();
              
              /*Start checking cache updates where transId*/
              var callBackStatus;
              var listener = setInterval(function() {
                $.ajax({
                  url: "https://ngbookstore.glitch.me/listener",
                  type: "POST",
                  data: listenerArgs,
                  dataType: "json",
                  async: true,
                  success: function(e) {
                    //alert(JSON.stringify(e));
                    var status = e.status;
                    callBackStatus = JSON.parse(e.callBackStatus);
                    
                    if(status !== "PendingCompletion") {
                      alert(JSON.stringify(e));
                      $(".processing i").hide();
                      $(".processing span").text("Transaction Completed With a StatusCode: " + status);
                      clearInterval(listener);
                      setTimeout(function() {
                        $(".overlay-wrapper").hide();
                      },5000);
                    }
                  }
                });
              },3000);
              
              /*Default Processing Timeout | Global Kill Switch [50s MAX_EXEC_TIME]*/
              setTimeout(function() {
                clearInterval(listener);
                // check if callback was invoked
                if(callBackStatus) {
                  $(".processing span").text("Operation Timed Out. Please Try Again.");
                } else {
                  $(".processing i").hide();
                  $(".processing span").text("ERR_CODE 500: Error Fetching Processing Results.");
                }
                
                /*Allow 4s window before closing overlay*/
                setTimeout(function() {
                  $(".overlay-wrapper").hide();
                },4000);
              }, 51000);
              
            } else {
              $(".processing span").text("Error Initiating Transaction. Please Try Again.");
              setTimeout(function() {
                $(".overlay-wrapper").hide();
              },5000);
            }
          }
        });
      } else {
        alert("Invalid Phone Number");
      }
    } else {
      alert ("Invalid Amount");
    }
    return false;
  });
});