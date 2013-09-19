/* ------------
   Control.js

   Requires global.js.

   Routines for the hardware simulation, NOT for our client OS itself. In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document envorinment inside a browser is the "bare metal" (so to speak) for which we write code that
   hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using JavaScript in
   both the host and client environments.

   This (and other host/simulation scripts) is the only place that we should see "web" code, like
   DOM manipulation and JavaScript event handling, and so on.  (Index.html is the only place for markup.)

   This code references page numbers in the text book:
   Operating System Concepts 8th editiion by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */


//
// Control Services
//
function simInit()
{
	// Get a global reference to the canvas.  TODO: Move this stuff into a Display Device Driver, maybe?
	CANVAS  = document.getElementById('display');
	// Get a global reference to the drawing context.
	DRAWING_CONTEXT = CANVAS.getContext('2d');
	// Enable the added-in canvas text functions (see canvastext.js for provenance and details).
	CanvasTextFunctions.enable(DRAWING_CONTEXT);
	// Clear the log text box.
	document.getElementById("taLog").value="";
	// Set focus on the start button.
   document.getElementById("btnStartOS").focus();     // TODO: This does not seem to work.  Why?
}

function simLog(msg, source)
{
    // Check the source.
    if (!source)
    {
        source = "?";
    }

    // Note the OS CLOCK.
    var clock = _OSclock;

    // Note the REAL clock in milliseconds since January 1, 1970.
    var now = new Date().getTime();

    // Build the log string.
    var str = "({ clock:" + clock + ", source:" + source + ", msg:" + msg + ", now:" + now  + " })"  + "\n";
    // WAS: var str = "[" + clock   + "]," + "[" + now    + "]," + "[" + source + "]," +"[" + msg    + "]"  + "\n";

    // Update the log console.
    taLog = document.getElementById("taLog");
    taLog.value = str + taLog.value;
    // Optionally udpate a log database or some streaming service.
}


//
// Control Events
//
function simBtnStartOS_click(btn)
{
    // Disable the start button...
    btn.disabled = true;
	btn.value = "OS has started."
    // .. enable the Emergency Halt and Reset buttons ...
    document.getElementById("btnHaltOS").disabled = false;
    document.getElementById("btnReset").disabled = false;
    document.getElementById("btnUpdateMemory").disabled = false;

    // .. set focus on the OS console display ...
    document.getElementById("display").focus();

    // ... Create and initialize the CPU ...
    _CPU = new cpu();
    _CPU.init();
    simLog("CPU simulation.","SIM");
	_Memory = new MainMemory();
	simLog("Main memory.","SIM");
	_MemoryAccessor = new MemoryAccessor();
    simLog("Memory access.","SIM");

    // ... then set the clock pulse simulation to call ?????????.
    hardwareClockID = setInterval(simClockPulse, CPU_CLOCK_INTERVAL);
    // .. and call the OS Kernel Bootstrap routine.
    krnBootstrap();
}

function simBtnHaltOS_click(btn)
{
    simLog("emergency halt", "host");
    simLog("Attempting Kernel shutdown.", "host");

    document.getElementById("btnHaltOS").disabled = false;
	document.getElementById("btnReset").disabled = false;
    document.getElementById("btnUpdateMemory").disabled = false;
    // Call the OS sutdown routine.
    krnShutdown();
    // Stop the JavaScript interval that's simulating our clock pulse.
    clearInterval(hardwareClockID);
    // TODO: Is there anything else we need to do here?
}

function simBtnReset_click(btn)
{
    // The easiest and most thorough way to do this is to reload (not refresh) the document.
    location.reload(true);
    // That boolean parameter is the 'forceget' flag. When it is true it causes the page to always
    // be reloaded from the server. If it is false or not specified, the browser may reload the
    // page from its cache, which is not what we want.
}

// Main Memory button
function simBtnUpdateMemory_click(btn)
{
    simUpdateMemoryDisplay();
}

function simEnableTimerInterrupt()
{

}

function simDisableTimerInterrupt()
{
    clearInterval(_hardwareClockId);
}

function simOnClockTick()
{
    krnInterruptDispatcher(TIMER_IRQ);
}


// Keyboard Interrupt
function simEnableKeyboardInterrupt()
{
     document.addEventListener("keydown", simOnKeypress, false);
}

function simDisableKeyboardInterrupt()
{
    document.removeEventListener("keydown", simOnKeypress, false);
}

function simOnKeypress(event)
{
    if (event.target.id == "display")
    {
        event.preventDefault();
        var params = new Array(event.which, event.shiftKey, event.ctrlKey);
        krnInterruptDispatcher(KEYBOARD_IRQ, params);
    }
}

//JC
function simSetStatus(str)
{
    var status = document.getElementById("status");
    var statusDate = document.getElementById("statusDate");
    statusBar.innerHTML = str + "<div id=\"statusDate\" class=\"statusDate\">"
          + statusDate.innerHTML + "</div>";
}

//JC
function simSetDate(str)
{
    var statusDate = document.getElementById("statusDate");
    statusDate.innerHTML = str;
}

// @return Array 2 bytes per element
function simFetchMachineCode()
{
     var code = document.getElementById("programInput").value;
     if( code == "" || code == "Enter user Programs Here" )
     {
          code = "";
     }
     else
     {
          code = code.toUpperCase();
          code = code.replace(/[^\Q0123456789ABCDEF\E]/g, "");
          code = code.explode(2);
     }
     return code;
}

function simUpdateCPUDisplay()
{
     var pc = stringFiller(_CPU.pc.toString(16).toUpperCase(),"0000");
     var ac = stringFiller(_CPU.acc.toString(16).toUpperCase(),"00");
     var x = stringFiller(_CPU.x.toString(16).toUpperCase(),"00");
     var y = stringFiller(_CPU.y.toString(16).toUpperCase(),"00");

     var cpuCode = document.getElementById("cpuCode");
     cpuCode.innerHTML = "[PC:" + pc + "] [AC:" + ac
                         + "] [X:" + x + "] [Y:" + y + "] [Z:" + _CPU.zero + "]";
}

function simUpdateMemoryDisplay()
{
     simLog("Updating Memory Display", "UI");
     var memoryCode = document.getElementById("memoryCode");
     memoryCode.innerHTML = "";
     for( var i=0; i < _Memory.length/8; i++ )
     {
          if( (i*8) % _MemoryManagement.pageSize == 0 )
          {
               memoryCode.innerHTML += " ---- Page break ---- <br>";
          }
          memoryCode.innerHTML += stringFiller((i*8).toString(16).toUpperCase(),"0000");
          memoryCode.innerHTML += ": ";
          for( var j=0; j < 8; j++ )
          {
               var cell = _MemoryAccessor.readCell((i*8)+j);
               memoryCode.innerHTML += stringFiller(cell.toString(16).toUpperCase(),"00");
               memoryCode.innerHTML += " ";
          }
          memoryCode.innerHTML += "<br>";
     }
}

function simUpdatePCBDisplay()
{
     var pcbCOde = document.getElementById("pcbCode");
     pcbCode.innerHTML = "";
     pcbCode.innerHTML = "PID State Base Limit  PC &nbsp;IR Ac &nbsp;X &nbsp;Y Z<br>";
     for( var i=0; i < _KernelReadyQueue.getSize(); i++ )
     {
          var process = _KernelReadyQueue.q.slice(i,i+1)[0];

          switch( process.state )
          {
          case PCB_READY:     status = "READY";
               //status += " <img src=\"images/pcb_ready.png\" />";
               break;
          case PCB_WAITING:   status = "WAITING"; break;
          case PCB_RUNNING:   status = "RUNNING"; break;
          case PCB_DONE:      status = "DONE";
               //status += " <img src=\"images/pcb_done.png\" />";
               break;
          case PCB_NEW:   status = "LOADING"; break;
          }

          var pid = stringFiller(process.pid.toString(10).toUpperCase(),"000");
          var base = stringFiller(process.baseAddress.toString(16).toUpperCase(),"0000");
          var limit = stringFiller(process.limitAddress.toString(16).toUpperCase(),"0000");
          var pc = stringFiller(process.regPC.toString(16).toUpperCase(),"0000");
          var ir = stringFiller(process.regIR.toString(16).toUpperCase(),"00");
          var acc = stringFiller(process.regAcc.toString(16).toUpperCase(),"00");
          var x = stringFiller(process.regX.toString(16).toUpperCase(),"00");
          var y = stringFiller(process.regY.toString(16).toUpperCase(),"00");
          var zero = stringFiller(process.zero.toString().toUpperCase(),"0");
          pcbCode.innerHTML += pid + " " + status + " " + base + " " +
          limit + " " + pc + " " + ir + " " + acc + " " + x + " " +
          y + " " + zero + "<br>";
     }

}
