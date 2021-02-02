def baseCommand = '--all'
def affectedApps = []

pipeline {
  agent {
    node {
      label "node12-cypress"
    }
  }
  parameters {
    string(
      name: 'affectedBase',
      defaultValue: '',
      description: 'Base command for nx affected; use --base={Commit SHA} or --all.'
    )
  }
  stages {
    stage("Prepare") {
      steps {
        checkout scm
        sh "npm install"
        script {
          if (params.affectedBase) {
            baseCommand = affectedBase
          } else if (env.GIT_PREVIOUS_SUCCESSFUL_COMMIT) {
            baseCommand = "--base=${env.GIT_PREVIOUS_SUCCESSFUL_COMMIT}"
          }

          affectedApps = sh (
            script: "npx nx affected:apps --plain ${baseCommand}",
            returnStdout: true
          ).split()
        }
        echo "Building with base ${baseCommand} and affected apps: ${affectedApps.join(', ')}"
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
    stage("Promote to Dev") {
      when {
        expression { return affectedApps }
      }
      steps {
        script {
          openshift.withCluster() {
            openshift.withProject() {
              affectedApps.each { affected ->
                def is = openshift.selector("is", "${affected}")
                if ( is.exists() ) {
                  openshift.tag("${affected}:latest", "${affected}:dev")
                }
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
                  def rm = dc.rollout()
                  rm.latest()
                  rm.status()
                }
              }
            }
          }
        }
      }
    }
    stage("Smoke Test"){
      steps {
        // sh "cd ./apps/QA/ && npm ci"
        // sh "cd ./apps/QA/ && npm run ci:smokeTest-headless"
        sh "npm ci"
        sh "npm run tmw-e2e:smoke 'https://tenant-management-webapp-core-services-dev.os99.gov.ab.ca/'"
      }
      post {
        always {
          sh "node ./apps/tenant-management-webapp-e2e/src/support/multiple-cucumber-html-reporter.js"
          archiveArtifacts artifacts: 'dist/cypress/**/*.*'
        }
        success {
          slackSend(
            color: "good",
            message: "Core Services pipeline ${env.BUILD_NUMBER} ready for promotion to Test: ${env.BUILD_URL}"
          )
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
                    def is = openshift.selector("is", "${affected}")
                    if ( is.exists() ) {
                      openshift.tag("${affected}:dev", "${affected}:test")
                    }
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
    stage("Regression Test"){
      steps {
        sh "npm ci"
        sh "npm run tmw-e2e:regression 'https://tenant-management-webapp-test.os99.int.alberta.ca/'"
      }
      post {
        always {
          sh "node ./apps/tenant-management-webapp-e2e/src/support/multiple-cucumber-html-reporter.js"
          archiveArtifacts artifacts: 'dist/cypress/**/*.*'
        }
      }
    }
  }
  post {
    success {
      slackSend color: "good", message: "Core Services pipeline ${env.BUILD_NUMBER} Completed."
    }
    failure {
      slackSend color: "bad", message: "Core Services pipeline ${env.BUILD_NUMBER} Failed: ${env.BUILD_URL}"
    }
  }
}
