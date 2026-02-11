import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import {
  Close,
  WhatsApp,
  MoreVert,
  Devices,
  QrCodeScanner,
  Refresh,
  HelpOutline,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';

const QRCodeModal = ({
  open,
  onClose,
  qrCode,
  qrSource,
  loading,
  deviceName,
  serverId = 'CHATFLOW',
  onRefresh,
  error,
  connected = false,
}) => {
  const steps = [
    'Open WhatsApp on your phone',
    'Tap on 3-dots menu (top right)',
    'Select "Linked Devices"',
    'Scan QR Code below',
  ];

  const renderQRContent = () => {
    if (loading) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
            Generating QR Code...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Please wait while we prepare your connection
          </Typography>
        </Box>
      );
    }

    if (connected) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
          <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h6" color="success.main" gutterBottom>
            Device Successfully Connected!
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            "{deviceName}" is now connected to WhatsApp
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can start sending messages now
          </Typography>
          <Chip
            label="Connected"
            color="success"
            icon={<CheckCircle />}
            sx={{ mt: 2 }}
          />
        </Box>
      );
    }

    if (error) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
          <ErrorIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h6" color="error.main" gutterBottom>
            Connection Failed
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
            sx={{ mb: 2 }}
          >
            Try Again
          </Button>
          <Alert severity="info" sx={{ width: '100%' }}>
            <Typography variant="body2">
              <strong>Troubleshooting:</strong>
              <br />• Check your internet connection
              <br />• Make sure WhatsApp is updated
              <br />• Try refreshing the QR code
            </Typography>
          </Alert>
        </Box>
      );
    }

    if (qrCode) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" py={2}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            SERVER ID: {serverId}
          </Typography>
          
          <Paper
            elevation={3}
            sx={{
              p: 2,
              mb: 2,
              border: '2px dashed',
              borderColor: 'primary.main',
              backgroundColor: 'background.paper',
              position: 'relative',
            }}
          >
            <img
              src={qrCode}
              alt="WhatsApp QR Code"
              style={{
                maxWidth: '280px',
                height: 'auto',
                display: 'block',
                borderRadius: '8px',
              }}
            />
            
            {/* QR Code Status Badge */}
            <Chip
              label={qrSource === 'chatflow' ? 'Real QR' : 'Mock QR'}
              color={qrSource === 'chatflow' ? 'success' : 'warning'}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontWeight: 'bold',
              }}
            />
          </Paper>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Scan QR Code within 24 seconds
          </Typography>

          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={onRefresh}
            >
              Refresh QR
            </Button>
            <Button
              variant="text"
              size="small"
              startIcon={<HelpOutline />}
              href="https://faq.whatsapp.com/web"
              target="_blank"
              rel="noopener noreferrer"
            >
              Need Help?
            </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          No QR Code available
        </Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={onRefresh}
          sx={{ mt: 2 }}
        >
          Generate QR Code
        </Button>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 2,
        }}
      >
        <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsApp />
          Connect to WhatsApp
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'inherit' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }}>
          {/* Left Side - Instructions */}
          <Box
            sx={{
              flex: 1,
              p: 3,
              bgcolor: 'grey.50',
              borderRight: { md: '1px solid', borderColor: 'divider' },
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              How to Connect:
            </Typography>

            <Stepper activeStep={-1} orientation="vertical" sx={{ mb: 3 }}>
              {steps.map((label, index) => (
                <Step key={index} completed={false}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Chip
                        label={index + 1}
                        size="small"
                        color="primary"
                        sx={{
                          fontWeight: 'bold',
                          minWidth: '24px',
                          height: '24px',
                        }}
                      />
                    )}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Quick Tips:
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  <li>Make sure WhatsApp is updated</li>
                  <li>Keep your phone unlocked during scanning</li>
                  <li>QR code expires in 22 seconds</li>
                  <li>Only one device can be connected at a time</li>
                </ul>
              </Typography>
            </Box>

            {deviceName && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Device:</strong> {deviceName}
                </Typography>
              </Alert>
            )}
          </Box>

          {/* Right Side - QR Code */}
          <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
              Scan QR Code
            </Typography>
            
            {renderQRContent()}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {!connected && !loading && qrCode && (
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={onRefresh}
          >
            Refresh QR Code
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QRCodeModal;
