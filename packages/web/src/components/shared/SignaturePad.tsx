import { useRef, useEffect, useState, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Box, Button, Typography } from '@mui/material';

// Signature pad — canvas ให้ผู้ใช้ลงลายเซ็นด้วยเมาส์/ทัช
// คืนค่าเป็น data URL (PNG base64) ผ่าน onChange callback
interface Props {
  width?: number;
  height?: number;
  label?: string;
  value?: string | null;
  onChange?: (dataUrl: string | null) => void;
  disabled?: boolean;
}

export default function SignaturePad({
  width = 400,
  height = 150,
  label,
  value,
  onChange,
  disabled = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // โหลดค่า initial value (data URL) ลงบน canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setIsEmpty(false);
      };
      img.src = value;
    } else {
      setIsEmpty(true);
    }
  }, [value, width, height]);

  const getPos = (e: ReactMouseEvent | ReactTouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: ReactMouseEvent | ReactTouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#163f6b';
    setIsDrawing(true);
  };

  const draw = (e: ReactMouseEvent | ReactTouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setIsEmpty(false);
    if (onChange) {
      const dataUrl = canvasRef.current!.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange?.(null);
  };

  return (
    <Box>
      {label && (
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5a6d80', mb: .5, textTransform: 'uppercase' }}>
          {label}
        </Typography>
      )}
      <Box
        sx={{
          border: '2px dashed rgba(22,63,107,.25)',
          borderRadius: 1,
          bgcolor: disabled ? '#f8fafc' : '#fff',
          position: 'relative',
          display: 'inline-block',
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          style={{
            display: 'block',
            touchAction: 'none',
            cursor: disabled ? 'not-allowed' : 'crosshair',
            maxWidth: '100%',
          }}
        />
        {isEmpty && !disabled && (
          <Typography
            sx={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 11, color: '#8a9cb2',
              pointerEvents: 'none',
            }}
          >
            ลงลายเซ็นที่นี่ · Sign here
          </Typography>
        )}
      </Box>
      <Box sx={{ mt: 1 }}>
        <Button size="small" onClick={clear} disabled={disabled || isEmpty} sx={{ fontSize: 11 }}>
          <span className="material-icons-outlined" style={{ fontSize: 14, marginRight: 4 }}>refresh</span>
          ล้างลายเซ็น
        </Button>
      </Box>
    </Box>
  );
}
