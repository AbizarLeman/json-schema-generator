import { JSX, useEffect, useState } from "react";

import {
  Alert,
  Autocomplete,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Snackbar,
  TextField,
  type AlertColor
} from "@mui/material";

import {
  CancelOutlined,
  DataObjectOutlined,
  FolderOutlined,
} from "@mui/icons-material";

const App = (): JSX.Element => {
  const [filePath, setFilePath] = useState<string>("");

  const [schemas, setSchemas] = useState<string[]>([]);
  const [schemaValues, setSchemaValues] = useState<string[]>([]);
  const [searchTextValue, setSearchTextValue] = useState("");

  const [isSpecificationValid, setIsSpecificationValid] = useState<boolean>(true);
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState<boolean>(false);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    message: string;
    status: AlertColor;
  }>({
    isOpen: false,
    message: "JSON schema generated successfully!",
    status: "success"
  });

  const handleOnClickBrowse = async () => {
    if (filePath) {
      setIsSpecificationValid(true);
      setFilePath("");
      setSchemaValues([]);
    } else {
      const filePaths = await window.api.openFileDialog();

      if (filePaths && filePaths.length > 0) {
        setFilePath(filePaths[0]);

        const isValid = await window.api.validateOpenAPISpecification(filePaths[0]);
        setIsSpecificationValid(isValid);
      }
    };
  };

  const handleOnClickSave = async () => {
    try {
      const directory = (await window.api.openDirectoryDialog())[0];

      schemaValues.forEach(schema => {
        window.api.generateSchemaFile({ schemaName: schema, outputFolder: directory, filePath: filePath });
      });

      setAlert({
        isOpen: true,
        status: "success",
        message: "JSON schema generated successfully!"
      });

      window.api.openFileExplorer(directory);
    } catch {
      setAlert({
        isOpen: true,
        status: "error",
        message: "Failed to generate the selected JSON schema(s)!"
      });
    } finally {
      setIsSpecificationValid(true);
      setFilePath("");
      setSchemaValues([]);
      setIsConfirmationDialogOpen(false);
    }
  };

  useEffect(() => {
    const getSchemas = async (filePath: string) => {
      const schemas = await window.api.getSchemasByFilePath(filePath);

      setSchemas(() => schemas);
    };

    if (filePath !== "")
      getSchemas(filePath);
  }, [filePath]);

  return (
    <Container sx={{ height: "100dvh" }}>
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        sx={{ height: "100%" }}
        direction={"column"}
        spacing={2}
      >
        <Grid size={12}>
          <Grid
            container
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{ height: "100%" }}
          >
            <Grid size={9}>
              <TextField
                fullWidth
                value={filePath}
                label={filePath ? "Selected file location" : "Please select a YAML file."}
                helperText={!isSpecificationValid ? "Invalid YAML file selected." : ""}
                error={!isSpecificationValid}
                variant="outlined"
                size="small"
                disabled
              />

            </Grid>
            <Grid size={3}>
              <Button
                fullWidth
                variant="contained"
                color={filePath ? "error" : "primary"}
                onClick={handleOnClickBrowse}
                endIcon={filePath ? <CancelOutlined /> : <FolderOutlined />}
              >
                {filePath ? "Cancel" : "Browse"}
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid size={12}>
          <Grid
            container
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{ height: "100%" }}
          >
            <Grid size={9}>
              <Autocomplete
                value={schemaValues}
                onChange={(_, newValue: string[]) => {
                  setSchemaValues(newValue);
                }}
                inputValue={searchTextValue}
                onInputChange={(_, newInputValue) => {
                  setSearchTextValue(newInputValue);
                }}
                multiple
                options={schemas}
                getOptionLabel={(option) => option}
                filterSelectedOptions
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Schema"
                  />
                )}
                disabled={filePath === "" || !isSpecificationValid}
                size="small"
                limitTags={2}
                fullWidth
              />
            </Grid>
            <Grid size={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setIsConfirmationDialogOpen(true)}
                endIcon={<DataObjectOutlined />}
                disabled={filePath === "" || schemaValues.length <= 0 || !isSpecificationValid}
              >
                Generate
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Dialog
        open={isConfirmationDialogOpen}
        onClose={() => setIsConfirmationDialogOpen(false)}
        fullScreen
      >
        <DialogTitle>
          {"Generate JSON schema for the following selection."}
        </DialogTitle>
        <DialogContent>
          {schemaValues.map(schema => (
            <DialogContentText key={schema}>
              {schema}
            </DialogContentText>
          ))}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setIsConfirmationDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleOnClickSave} autoFocus>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        autoHideDuration={1000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={alert.isOpen}
        onClose={() => setAlert(previousState => ({ ...previousState, isOpen: false }))}
      >
        <Alert
          onClose={() => setAlert(previousState => ({ ...previousState, isOpen: false }))}
          severity={alert.status}
          variant="outlined"
          sx={{ width: "100%", backgroundColor: "white" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default App;

