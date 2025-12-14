// dolphinjs/examples/embedded-app.jsx
import { createApp, useState, useEffect } from 'dolphin-embedded';

function EmbeddedApp() {
  const [temperature, setTemperature] = useState(25);
  const [humidity, setHumidity] = useState(60);
  const [ledState, setLedState] = useState(false);
  const [gpioState, setGpioState] = useState(Array(16).fill(0));
  const [i2cData, setI2cData] = useState([0x00, 0x00, 0x00]);
  
  // Initialize hardware on mount
  useEffect(() => {
    console.log("Initializing embedded hardware...");
    
    // Initialize GPIO
    gpio_init_all();
    
    // Initialize I2C
    i2c_init(I2C_PORT_0, 100000);
    
    // Initialize ADC for sensors
    adc_init(ADC_CHANNEL_0);
    adc_init(ADC_CHANNEL_1);
    
    // Set up sensor polling
    const sensorInterval = setInterval(() => {
      // Read actual hardware sensors
      const temp = read_temperature_sensor();
      const hum = read_humidity_sensor();
      
      if (temp !== null) setTemperature(temp);
      if (hum !== null) setHumidity(hum);
      
      // Read I2C devices
      const i2cResult = i2c_read(I2C_ADDR_SENSOR, 3);
      setI2cData(i2cResult);
    }, 2000);
    
    return () => {
      clearInterval(sensorInterval);
      gpio_cleanup_all();
    };
  }, []);
  
  const toggleLed = (pin = 13) => {
    const newState = !ledState;
    setLedState(newState);
    
    // Hardware GPIO control
    gpio_write(pin, newState ? 1 : 0);
    console.log(`GPIO${pin}: ${newState ? 'HIGH' : 'LOW'}`);
  };
  
  const readSensors = () => {
    console.log('Reading sensors...');
    
    // Actual hardware calls
    const temp = adc_read(ADC_CHANNEL_0) * 0.1;
    const hum = adc_read(ADC_CHANNEL_1) * 0.1;
    
    setTemperature(20 + temp);
    setHumidity(50 + hum);
  };
  
  const toggleGpio = (pin) => {
    setGpioState(prev => {
      const newState = [...prev];
      newState[pin] = newState[pin] ? 0 : 1;
      
      // Write to hardware
      gpio_write(pin, newState[pin]);
      console.log(`GPIO ${pin}: ${newState[pin] ? 'HIGH' : 'LOW'}`);
      
      return newState;
    });
  };
  
  const i2cScan = () => {
    console.log('Scanning I2C bus...');
    const devices = i2c_scan();
    console.log('Found devices:', devices);
    return devices;
  };
  
  const spiTransfer = () => {
    console.log('SPI transfer...');
    const data = spi_write_read([0x01, 0x02, 0x03]);
    console.log('SPI received:', data);
    return data;
  };
  
  return createElement('Screen', { width: 480, height: 320, theme: 'dark' },
    createElement('AppBar', { title: 'Embedded System Dashboard' },
      createElement('Chip', { color: 'success' }, 'GPIO: Ready'),
      createElement('Chip', { color: 'warning' }, 'I2C: Ready'),
      createElement('Chip', { color: 'info' }, 'SPI: Ready')
    ),
    createElement('Container', { padding: 20 },
      createElement('Row', { spacing: 15 },
        createElement('Column', { width: 300 },
          createElement('Card', { title: 'Sensor Readings' },
            createElement('Grid', { columns: 2, spacing: 10 },
              createElement('SensorDisplay', {
                icon: 'thermometer',
                label: 'Temperature',
                value: `${temperature.toFixed(1)}°C`,
                color: '#FF6B6B',
                trend: 'up'
              }),
              createElement('SensorDisplay', {
                icon: 'droplet',
                label: 'Humidity',
                value: `${humidity.toFixed(1)}%`,
                color: '#4ECDC4',
                trend: 'stable'
              })
            ),
            createElement('Divider', null),
            createElement('Text', { size: 12, color: 'gray' },
              `Last updated: ${new Date().toLocaleTimeString()}`
            )
          ),
          createElement('Card', { title: 'GPIO Control', marginTop: 15 },
            createElement('Text', { size: 14, marginBottom: 10 }, 'GPIO Pins (0-15):'),
            createElement('Grid', { columns: 4, spacing: 5 },
              ...gpioState.map((state, pin) => 
                createElement(GPIOPin, {
                  key: pin,
                  pin: pin,
                  state: state,
                  mode: pin === 13 ? "output" : "input",
                  onToggle: () => toggleGpio(pin)
                })
              )
            ),
            createElement('Row', { marginTop: 10 },
              createElement('Button', {
                onPress: () => gpioState.forEach((_, pin) => toggleGpio(pin)),
                variant: 'outline',
                small: true
              }, 'Toggle All'),
              createElement('Button', {
                onPress: () => setGpioState(Array(16).fill(0)),
                variant: 'outline',
                small: true
              }, 'Clear All')
            )
          )
        ),
        createElement('Column', null,
          createElement('Card', { title: 'Hardware Controls' },
            createElement('ButtonGroup', { vertical: true },
              createElement('Button', {
                onPress: toggleLed,
                icon: 'power',
                color: ledState ? "success" : "secondary"
              }, `LED GPIO13: ${ledState ? "ON" : "OFF"}`),
              createElement('Button', {
                onPress: readSensors,
                icon: 'refresh-cw',
                variant: 'outline'
              }, 'Read Sensors'),
              createElement('Button', {
                onPress: i2cScan,
                icon: 'search',
                variant: 'outline'
              }, 'Scan I2C Bus'),
              createElement('Button', {
                onPress: spiTransfer,
                icon: 'zap',
                variant: 'outline'
              }, 'SPI Transfer')
            ),
            createElement('Divider', { margin: 10 }),
            createElement('Text', { size: 14, marginBottom: 5 }, 'I2C Data (Hex):'),
            createElement('CodeBlock', null,
              i2cData.map(byte => byte.toString(16).padStart(2, '0')).join(' ')
            )
          ),
          createElement('Card', { title: 'System Info', marginTop: 15 },
            createElement('InfoList', null,
              createElement('InfoItem', { label: 'Platform', value: get_platform() }),
              createElement('InfoItem', { label: 'CPU', value: get_cpu_freq() + " MHz" }),
              createElement('InfoItem', { label: 'Memory', value: get_free_memory() + " KB free" }),
              createElement('InfoItem', { label: 'Uptime', value: get_uptime() }),
              createElement('InfoItem', { label: 'Temperature', value: get_cpu_temp() + "°C" })
            )
          )
        )
      ),
      createElement('Row', { marginTop: 20 },
        createElement('Column', null,
          createElement('Card', { title: 'Serial Console' },
            createElement('ConsoleOutput', { height: 150 },
              `Embedded System Ready
Platform: ${get_platform()}
Architecture: ${get_arch()}
GPIO: Available (${gpioState.filter(s => s).length}/16 active)
I2C: Available (Port ${I2C_PORT_0})
SPI: Available (MISO: ${SPI_MISO}, MOSI: ${SPI_MOSI})
ADC: Available (Channels: 0-${ADC_CHANNEL_MAX})
PWM: Available
UART: Available

> System initialized successfully`
            ),
            createElement('Row', { marginTop: 10 },
              createElement('Input', {
                placeholder: 'Enter command...',
                onEnter: (cmd) => console_execute(cmd),
                width: 200
              }),
              createElement('Button', {
                onPress: () => console_clear(),
                variant: 'text',
                small: true
              }, 'Clear')
            )
          )
        )
      )
    )
  );
}

// Helper components using createElement
function GPIOPin({ pin, state, mode, onToggle }) {
  return createElement('Button', {
    onPress: onToggle,
    size: 'xs',
    variant: state ? "filled" : "outline",
    color: state ? "success" : "secondary",
    disabled: mode === "input",
    title: `GPIO${pin}`
  }, pin.toString());
}

function SensorDisplay({ icon, label, value, color, trend }) {
  return createElement('div', { style: { padding: '10px', borderLeft: `3px solid ${color}` } },
    createElement('Row', { align: 'center' },
      createElement('Icon', { name: icon, color: color, size: 20 }),
      createElement('Text', { bold: true, size: 14, marginLeft: 5 }, label)
    ),
    createElement('Text', { size: 24, marginTop: 5 }, value),
    trend && createElement('Text', { size: 10, color: 'gray' },
      `Trend: ${trend}`
    )
  );
}

// Initialize and run the app
console.log('Starting DolphinJS Embedded App...');

const app = createApp({
  component: EmbeddedApp,
  platform: 'embedded',
  debug: true,
  hardware: {
    gpio: true,
    i2c: true,
    spi: true,
    adc: true,
    pwm: true,
    uart: true
  },
  display: {
    type: 'ili9341',
    width: 480,
    height: 320,
    spi: {
      miso: 19,
      mosi: 23,
      sclk: 18,
      cs: 5,
      dc: 21,
      rst: 22
    }
  }
});

// For testing in Node.js
if (typeof window === 'undefined') {
  console.log('\nEmbedded App Structure:');
  
  // Simulate hardware calls for Node.js environment
  global.gpio_init_all = () => console.log("GPIO initialized");
  global.i2c_init = (port, speed) => console.log(`I2C port ${port} at ${speed}Hz`);
  global.adc_init = (channel) => console.log(`ADC channel ${channel} ready`);
  global.get_platform = () => process.platform;
  global.get_arch = () => process.arch;
  global.get_uptime = () => "00:15:42";
  global.get_free_memory = () => Math.floor(Math.random() * 100) + 50;
  
  console.log('Running in Node.js - Hardware calls simulated');
  console.log('Build with: dolphin build embedded-app.jsx --platform embedded');
}

export default EmbeddedApp;