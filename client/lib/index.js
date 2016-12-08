/*
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * eclairjs swift module.
 * @example
 * var ejsKafka = require('eclairjs-swift');
 * @module eclairjs-kafka
 */
function EclairJSSwift(obj) {

  this.eclairjs = obj.eclairjs;
  this.service = obj.service;
  this.isBluemixSpark = false;
  this.jar = obj.jar
    ? obj.jar
    : "http://repo2.maven.org/maven2/org/eclairjs/eclairjs-swift/0.10/eclairjs-swift-0.10-jar-with-dependencies.jar"

  this.credentials = {};
  if(obj.credentials) {
    this.credentials = obj.credentials;
  } else if(process.env.VCAP_SERVICES) {
    var vcap = JSON.parse(process.env.VCAP_SERVICES);   
    if(vcap['Object-Storage']) {
      this.credentials = vcap['Object-Storage'][0]['credentials'];
    }
    if(vcap['spark']) {
      this.isBluemixSpark = true;
    }
  }
}

function setHadoopConfig(sc, service, credentials) {
  var prefix = "fs.swift2d.service."+service+".";
  return Promise.all([
    sc.setHadoopConfiguration("fs.swift2d.impl", "com.ibm.stocator.fs.ObjectStoreFileSystem"), 
    sc.setHadoopConfiguration(prefix+"auth.url", credentials.auth_url + "/v3/auth/tokens"),
    sc.setHadoopConfiguration(prefix+"tenant", credentials.projectId),
    sc.setHadoopConfiguration(prefix+"public", "true"),
    sc.setHadoopConfiguration(prefix+"username", credentials.userId),
    sc.setHadoopConfiguration(prefix+"password", credentials.password),
    sc.setHadoopConfiguration(prefix+"region", credentials.region),
    sc.setHadoopConfiguration(prefix+"auth.method", "keystoneV3"),
  ]);
};

EclairJSSwift.prototype.init = function(sparkContext) {

  //Stocator jar is already loaded in spark as a service.
  if(this.isBluemixSpark) {
    return setHadoopConfig(sparkContext, this.service, this.credentials);
  }

  var swift = this;
  return new Promise(function (resolve, reject) {
    swift.eclairjs.addJar(swift.jar).then(function() {
      setHadoopConfig(
        sparkContext, 
        swift.service, 
        swift.credentials
      ).then(resolve).catch(reject);
    }).catch(reject);
  });
}

module.exports = EclairJSSwift;
