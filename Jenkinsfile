def baseCommand = "--all"
def affectedApps = []

pipeline {
  agent {
    node {
      label "node12"
    }
  }
  stages {
    stage("Prepare") {
      steps {
        checkout scm
        sh "npm install"
        // script {
        //   if (env.GIT_PREVIOUS_SUCCESSFUL_COMMIT){
        //     baseCommand = "--base=${GIT_PREVIOUS_SUCCESSFUL_COMMIT}"
        //   }
        // }
        script {
          affectedApps = sh (
            script: "npx nx affected:apps --plain ${baseCommand}",
            returnStdout: true
          ).split()
        }
      }
    }
    stage("Lint"){
      steps {
        sh "npx nx affected --target=lint ${baseCommand} --parallel"
      }
    }
    stage("Test"){
      steps {
        sh "npx nx affected --target=test ${baseCommand} --parallel"
      }
    }
    stage("Build") {
      when {
        expression { return affectedApps }
      }
      steps {
        sh "npx nx affected --target=build ${baseCommand} --parallel"
        sh "npm prune --production"
        script {
          openshift.withCluster() {
            openshift.withProject() {
              affectedApps.each { affected ->
                def bc = openshift.selector("bc", affected)
                
                if ( bc.exists() ) {
                  if(affected.endsWith("app")){
                     bc.startBuild("--from-dir=dist/apps/${affected}", "--wait", "--follow")
                  } else { 
                     bc.startBuild("--from-dir=.", "--wait", "--follow")
                  }
                }
              }
            }
          }
        }
      }
    }
    stage("Smoke Test"){
      steps {
        sh "ls ./*"
        //sh "cd ./apps/QA && npm run ci:somekeTest --silent"
      }
    }
    stage("Promote to Dev") {
      when {
        expression { return affectedApps }
      }
      steps {
        script {
          openshift.withCluster() {
            openshift.withProject() {
              affectedApps.each { affected ->
                openshift.tag("${affected}:latest", "${affected}:dev") 
              }
            }
          }
        }
        script {
          openshift.withCluster() {
            openshift.withProject("core-services-dev") {
              affectedApps.each { affected ->
                def dc = openshift.selector("dc", "${affected}")
                if ( dc.exists() ) {
                  dc.rollout().latest()
                }
              }
            }
          }
        }
      }
    }
    stage("Promote to Test") {
      options {
        timeout(time: 3, unit: "HOURS")
      }
      
      input{
        message "Promote to Test?"
        ok "Yes"
        //submitter "david.spedzia"
      }
      when {
        expression { return affectedApps }
      }
      steps {   
        script {
          Exception caughtException = null
          catchError(buildResult: 'SUCCESS', stageResult: 'ABORTED'){
            try {
              openshift.verbose()
              openshift.withCluster() {
                openshift.withProject() {
                  affectedApps.each { affected ->
                    openshift.tag("${affected}:latest", "${affected}:test")
                  }
                }
              }
            }
            catch (org.jenkinsci.plugins.workflow.steps.FlowInterruptedException e) {
              error "Caught ${e.toString()}"
            }
            catch (Throwable e) {
              caughtException = e
            }
            if (caughtException){
              error caughtException.message
            }
          }          
        }
        script {
          Exception caughtException = null
          catchError(buildResult: 'SUCCESS', stageResult: 'ABORTED'){
            try {
              openshift.verbose()
              openshift.withCluster() {
                openshift.withProject("core-services-test") {
                  affectedApps.each { affected ->
                    def dc = openshift.selector("dc", "${affected}")
                    if ( dc.exists() ) {
                      sh "echo in the last step deploy ${affected}"
                      dc.rollout().latest()
                    }
                  }
                }
              }                      
            }
            catch(org.jenkinsci.plugins.workflow.steps.FlowInterruptedException e){
              error "Caught ${e.toString()}"
            }
            catch(Throwable e){
              error caughtException.message
            }
            if (caughtException){
              error caughtException.message
            }
          }
        }
      }       
    }  
  }
}


  stage('Smoke Test') {
    sh 'cd qa && npm run ci:smokeTest --silent'
  }