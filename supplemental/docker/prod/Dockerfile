FROM ubuntu as app

ARG BUILD_REPO
ARG ROOTDIR=/home/httpd/www/
ARG BUILD_BASE_COMMIT_ID="not found"

LABEL maintainer="ivan.kuchin@gmail.com"
LABEL org.opencontainers.image.source="https://github.com/IvanKuchin/${BUILD_REPO}"

####################
# copy from repo   #
####################
COPY ./html/ ${ROOTDIR}html/
COPY ./supplemental/apache2/ /etc/apache2/

WORKDIR ${ROOTDIR}html/

###################
# install apache2 #
###################
RUN apt update \
    && apt-get install --no-install-recommends --no-install-suggests -y apache2 \
    && rm -rf /var/lib/apt/lists/*

#####################
# configure apache2 #
#####################
RUN mkdir -p ${ROOTDIR}logs/

RUN a2enmod rewrite \
 && a2enmod expires \
 && a2enmod headers \
 && a2enmod proxy \
 && a2enconf mod_expires \
 && a2dismod cgi \
 && a2dissite `ls /etc/apache2/sites-enabled/` \
 && a2ensite *www

##################
# save commit id #
##################
RUN mkdir -p ./info/
RUN echo ${BUILD_BASE_COMMIT_ID} > ./info/git_commit_id

####################################################################
# change folders to proper owner                                   #
####################################################################
RUN chown -R www-data:www-data /home/httpd/

############################################################
## forward request and error logs to docker log collector ##
############################################################
RUN ln -sf /dev/stdout ${ROOTDIR}logs/access.log \
 && ln -sf /dev/stderr ${ROOTDIR}logs/error.log

EXPOSE 80

CMD ["apachectl", "-D", "FOREGROUND"]

############################################################################################

