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
        sh "npm audit fix --force"
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
        sh "ls -la dist/apps"
        sh "ls -la dist/apps/tenant-management-webapp"
        script {
          openshift.verbose()
          openshift.withCluster() {
            openshift.withProject() {
              affectedApps.each { affected ->
                def bc = openshift.selector("bc", affected)
                sh "echo uuuuu ${affected}"

                if ( bc.exists() ) {
                  sh "echo ${affected}"
                  sh "echo build config exists"
                }

                if ( bc && affected != 'value-service' && affected != 'file-service') {
                  bc.startBuild("--from-dir=apps/${affected}", "--wait")
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
          openshift.verbose()
          openshift.withCluster() {
            openshift.withProject() {
              affectedApps.each { affected ->
                openshift.tag("${affected}:latest", "${affected}:dev")
              }
            }
          }
        }
        script {
          openshift.verbose()
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
  }
}
