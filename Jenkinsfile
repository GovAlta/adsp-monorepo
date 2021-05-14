def baseCommand = '--all'
def affectedApps = []
def affectedManifests = []

pipeline {
  options {
    timeout(time: 3, unit: "HOURS")
  }
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

          if (env.GIT_PREVIOUS_SUCCESSFUL_COMMIT) {
            affectedManifests = sh (
              script: "git diff --name-only HEAD ${env.GIT_PREVIOUS_SUCCESSFUL_COMMIT}",
              returnStdout: true
            )
            .tokenize()
            .findAll{ it.startsWith('.openshift/managed/') }
          }
        }
        echo "Building with base ${baseCommand} and affected apps: ${affectedApps.join(', ')}"
      }
    }
    stage("Manage Infra") {
      when {
        expression { return affectedManifests }
      }
      steps {
        script {
          affectedManifests.each { affected ->

            echo "Updating infra environment based on ${affected} ..."
            def template = readYaml(file: affected)

            openshift.withCluster() {
              openshift.withProject('core-services-infra') {
                def deployment = openshift.process(
                  template,
                  "-p",
                  "BUILD_TAG=latest"
                )
                .findAll{ it.metadata.labels["apply-infra"] == 'true' }

                openshift.apply(deployment)
              }
            }
          }
        }
      }
    }
    stage("Lint") {
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
        sh "npx nx affected --configuration=production --target=build ${baseCommand} --parallel"
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
        expression { return affectedApps || affectedManifests }
      }
      steps {
        script {
          openshift.withCluster() {
            openshift.withProject('core-services-dev') {
              affectedManifests.each { affected ->

                echo "Updating dev environment based on ${affected} ..."
                def template = readYaml(file: affected)

                def deployment = openshift.process(
                  template,
                  "-p",
                  "NAMESPACE=core-services-dev",
                  "DEPLOY_TAG=dev"
                )
                .findAll{ it.metadata.labels["apply-dev"] == 'true' }

                openshift.apply(deployment)
              }
            }
          }
        }
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
            script {
                // Update cypress.json file with tags before run the tests
                def text = readFile file: "apps/tenant-management-webapp-e2e/cypress.json"
                text = text.replaceAll(/"TAGS":.+/, "\"TAGS\": \"@smoke-test and not @ignore\",")
                writeFile file: "apps/tenant-management-webapp-e2e/cypress.json", text: text
            }
        sh "npx nx e2e tenant-management-webapp-e2e --dev-server-target='' --browser chrome --headless=true --baseUrl=https://tenant-management-webapp-core-services-dev.os99.gov.ab.ca --cypress-config='apps/tenant-management-webapp-e2e/cypress.json'"
      }
      post {
        always {
          sh "node ./apps/tenant-management-webapp-e2e/src/support/multiple-cucumber-html-reporter.js"
          zip zipFile: 'cypress-smoke-test-html-report.zip', archive: false, dir: 'dist/cypress'
          archiveArtifacts artifacts: 'cypress-smoke-test-html-report.zip'
        }
        success {
          slackSend(
            color: "good",
            message: "Core Services pipeline ${env.BUILD_NUMBER} ready for promotion to Test: ${env.BUILD_URL}"
          )
        }
        failure {
          // only publish smoke test results when smoke test fails. Otherwise, test results for the later stage, i.e. regression, will be published.
          junit '**/results/*.xml'
          cucumber '**/cucumber-json/*.json'
        }
      }
    }
    stage("Promote to Test") {
      input{
        message "Promote to Test?"
        ok "Yes"
      }
      when {
        expression { return affectedApps || affectedManifests }
      }
      steps {
        script {
          openshift.withCluster() {
            openshift.withProject('core-services-test') {
              affectedManifests.each { affected ->

                echo "Updating test environment based on ${affected} ..."
                def template = readYaml(file: affected)

                def deployment = openshift.process(
                  template,
                  "-p",
                  "NAMESPACE=core-services-test",
                  "DEPLOY_TAG=test"
                )
                .findAll{ it.metadata.labels["apply-test"] == 'true' }

                openshift.apply(deployment)
              }
            }
          }
        }
        script {
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
        script {
          openshift.withCluster() {
            openshift.withProject("core-services-test") {
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
    stage("Regression Test") {
      steps {
            script {
                // Update cypress.json file with tags before run the tests
                def text = readFile file: "apps/tenant-management-webapp-e2e/cypress.test.json"
                text = text.replaceAll(/"TAGS":.+/, "\"TAGS\": \"@regression and not @ignore\",")
                writeFile file: "apps/tenant-management-webapp-e2e/cypress.test.json", text: text
            }
        sh "npx nx e2e tenant-management-webapp-e2e --dev-server-target='' --browser chrome --headless=true --baseUrl=https://tenant-management-webapp-core-services-test.os99.gov.ab.ca --cypress-config='apps/tenant-management-webapp-e2e/cypress.test.json'"
      }
      post {
        always {
          junit "**/results/*.xml"
          cucumber "**/cucumber-json/*.json"
          sh "node ./apps/tenant-management-webapp-e2e/src/support/multiple-cucumber-html-reporter.js"
          zip zipFile: 'cypress-regression-test-html-report.zip', archive: false, dir: 'dist/cypress'
          archiveArtifacts artifacts: 'cypress-regression-test-html-report.zip'
        }
      }
    }
    stage("Promote to Staging") {
      input{
        message "Promote to Staging?"
        ok "Yes"
      }
      when {
        expression { return affectedApps || affectedManifests }
      }
      steps {
        script {
          openshift.withCluster() {
            openshift.withProject('core-services-uat') {
              affectedManifests.each { affected ->

                echo "Updating staging environment based on ${affected} ..."
                def template = readYaml(file: affected)

                def deployment = openshift.process(
                  template,
                  "-p",
                  "NAMESPACE=core-services-uat",
                  "DEPLOY_TAG=uat"
                )
                .findAll{ it.metadata.labels["apply-staging"] == 'true' }

                openshift.apply(deployment)
              }
            }
          }
        }
        script {
          openshift.withCluster() {
            openshift.withProject() {
              affectedApps.each { affected ->
                def is = openshift.selector("is", "${affected}")
                if ( is.exists() ) {
                  openshift.tag("${affected}:test", "${affected}:uat")
                }
              }
            }
          }
        }
        script {
          openshift.withCluster() {
            openshift.withProject("core-services-uat") {
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
