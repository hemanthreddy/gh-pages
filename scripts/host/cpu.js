/* ------------
   CPU.js

   Requires global.js.

   Routines for the host CPU simulation, NOT for the OS itself.
   In this manner, it's A LITTLE BIT like a hypervisor,
   in that the Document envorinment inside a browser is the "bare metal" (so to speak) for which we write code
   that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
   JavaScript in both the host and client environments.

   This code references page numbers in the text book:
   Operating System Concepts 8th editiion by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

function cpu()
{
    this.PC    = 0;     // Program Counter
    this.Acc   = 0;     // Accumulator
    this.Xreg  = 0;     // X register
    this.Yreg  = 0;     // Y register
    this.Zflag = 0;     // Z-ero flag (Think of it as "isZero".)
    this.isExecuting = false;
    this.isRunning;
    this.halt = cpuHalt;
    this.loadPC = cpuLoadPC;
    this.step = cpuStep;
    this.fetchAddress = cpuFetchAddress;
	this.trace = cpuTrace;
	this.init = cpuInit;
    this.init();

    this.init = function()
    {
        this.PC    = 0
        this.Acc   = 0;
        this.Xreg  = 0;
        this.Yreg  = 0;
        this.Zflag = 0;
        this.isExecuting = false;
    }

    this.pulse = function()
    {
        // TODO: Do we need this?  Probably not.
    }

    this.cycle = function()
    {
        krnTrace("CPU cycle");
        // TODO: Accumulate CPU usage and profiling statistics here.
        // Do real work here. Set this.isExecuting appropriately.
    }
}

function cpuInit()
{
     this.loadPC(0x0);
     this.isRunning = false;
}

function cpuLoadPC(address)
{
     this.pc = address;
}

function cpuStep()
{
     this.trace("Begin CPU step");
     var opCode = _MemoryAccessor.readCell(this.pc++);
     this.ir = opCode;
     if( parseInt("A9",16) == opCode ) //Load accumulator with constant
     {
          this.acc = _MemoryAccessor.readCell(this.pc++);
          this.trace("End A9");
     }
     else if( parseInt("AD",16) == opCode ) //Load accumulator from memory
     {
          var loadLocation = this.fetchAddress();
          this.acc = _MemoryAccessor.read( loadLocation ); // memory returns strings
          this.trace("End AD");
     }
     else if( parseInt("8D",16) == opCode ) //Store accumulator in memory
     {
          var storeLocation = this.fetchAddress();
          _MemoryAccessor.write( this.acc, storeLocation);
          this.trace("End 8D");
     }
     else if( parseInt("6D",16) == opCode ) //Add with carry
     {
          var loadLocation = this.fetchAddress();
          this.acc = this.acc + _MemoryAccessor.read( loadLocation );
          this.trace("End 6D");
     }
     else if( parseInt("A2",16) == opCode ) //Load x with constant
     {
          var constant = _MemoryAccessor.readCell(this.pc++);
          this.x = constant;
          this.trace("End A2");
     }
     else if( parseInt("AE",16) == opCode ) //Load x from memory
     {
          var loadLocation = this.fetchAddress();
          this.x = _MemoryAccessor.read( loadLocation );
          this.trace("End AE");
     }
     else if( parseInt("A0",16) == opCode ) //Load y with constant
     {
          var constant = _MemoryAccessor.readCell(this.pc++);
          this.y = constant;
          this.trace("End A0");
     }
     else if( parseInt("AC",16) == opCode ) //Load y from memory
     {
          var loadLocation = this.fetchAddress();
          this.y = _MemoryAccessor.read( loadLocation );
          this.trace("End AC");
     }
     else if( parseInt("EA",16) == opCode ) //no op
     {
          this.trace("End EA");
     }
     else if( parseInt("00",16) == opCode ) //Break
     {
          this.halt();
          systemCallTerminateProcess( _ActiveProcess );
          this.trace("End 00");
     }
     else if( parseInt("FF",16) == opCode ) //System call
     {
          this.trace("End FF");
     }
     else if( parseInt("EC",16) == opCode ) //Compare byte to reg X
     {
          var loadLocation = this.fetchAddress();
          var memoryByte = _MemoryAccessor.read( loadLocation );
          if( this.x == memoryByte )
               this.zero = 1;
          else
               this.zero = 0;
          this.trace("End EC");
     }
     else if( parseInt("D0",16) == opCode )
     {
          this.trace("Start BNE (D0) ");
          var distance = _MemoryAccessor.readCell(this.pc++);
          distance = distance.toString(16);	// hexa decimal string.
          this.trace("Distance: " + distance);
          if( this.zero == 0 )
          {
               var branchLoc = this.pc + parseInt(distance,16);
               this.trace("New loc base 16: "  + branchLoc.toString(16) );
               if (branchLoc > 0xFF)
               {
                   branchLoc = branchLoc - 0x100;
               }
               this.trace("Adjusted loc: " + branchLoc.toString(16));
               this.pc = branchLoc;
               this.trace("Branching to " + branchLoc.toString(16));
          }
          this.trace("End BNE (D0)");
     }
     else if( parseInt("EE",16) == opCode )
     {
          var loadLocation = this.fetchAddress();
          var memoryByte = _MemoryAccessor.read( loadLocation );
          _MemoryAccessor.write( ++memoryByte, loadLocation );
          this.trace("End EE");
     }
     else
     {
          this.trace("Invalid OP Code: " + opCode.toString(16).toUpperCase() );
          //kill the process
          systemCallTerminateProcess( _ActiveProcess );
          // TODO: trap error
     }
     simUpdatePCBDisplay();
}

function cpuHalt()
{
     this.isRunning = false;
}

function cpuFetchAddress()
{
     var lowEnd = _MemoryAccessor.readCell(this.pc++);
     var highEnd = _MemoryAccessor.readCell(this.pc++);
     return ( highEnd << 8 ) | lowEnd;
}

function cpuTrace(msg)
{
     if( _Trace )
     {
          simLog(msg + " (PC: " + this.pc.toString(16).toUpperCase()+")", "CPU");
     }
}

