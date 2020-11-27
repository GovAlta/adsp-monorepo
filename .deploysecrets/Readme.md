# Openshift Deploy Opaque Secrets Configuration Files

Opaque sercrets are required for the environment to function and can only be created via a template. 
Need to be added manually. 

## Base64 encoding

Fields in the template need to be base64 encoded. 
In unix run the following bash command to encode them: `echo "my-string" -n | base64` 
Then insert those values in the yaml file.

Alternatively use the provided script. 
Run it in WSL on Windows. 

With longer strings the base64 output will insert spaces in the middle, remove those when creating the yaml template file otherwise you will get an error.